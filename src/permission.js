import router from "./router";
import store from "./store";
import NProgress from "nprogress"; // 进度条指示器
import "nprogress/nprogress.css"; // 进度条指示器css
import getPageTitle from "@/utils/get-page-title"; // 获取当前页面标题
import storage from "@/utils/storage/index";

NProgress.configure({ showSpinner: false }); // 进度条指示器配置

const whiteList = ["/login", "/auth-redirect"]; // 白名单

let isFirst = true; // 是否第一次登陆

router.beforeEach(async (to, from, next) => {
  // 开始跑进度条
  NProgress.start();

  // 设置页面标题
  document.title = getPageTitle(to.meta.title);

  // 判断用户是否已经登录
  const hasToken = storage.getToken();
  if (hasToken) {
    if (to.path === "/login") {
      // 如果已经登录,重定向到主页
      next({ path: "/" });
      NProgress.done(); // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      if (isFirst === true) {
        isFirst = false;

        // 保存 token, userInfo, menu
        store.commit("user/SET_TOKEN", storage.getToken());
        store.commit("user/SET_USER_INFO", storage.getUserInfo());
        store.commit("user/SET_MENU", storage.getMenu());
        // 生成基于当前角色的访问route地图
        const accessRoutes = await store.dispatch("permission/generateRoutes", ["editor"]);
        console.log(accessRoutes);
        // 动态添加 route
        router.addRoutes(accessRoutes);

        // hack方式确保addRoutes完成
        // 设置 `replace: true` ,所以导航不会留下历史记录
        next({ ...to, replace: true });
      } else {
        next();
      }
    }
  } else {
    /* 没有 token */
    if (whiteList.indexOf(to.path) !== -1) {
      // 在登录白名单中，直接跳转
      next();
    } else {
      // 没有权限访问其他页面被重定向到登录页面。
      next(`/login?redirect=${to.path}`);
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  // 完成进度条
  NProgress.done();
});
