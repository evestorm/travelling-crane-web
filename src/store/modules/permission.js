import { asyncRoutes, constantRoutes } from "@/router";
import storage from "@/utils/storage/index";

/**
 * 使用 meta.role 来确定当前用户许可
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  // if (route.meta && route.meta.roles) {
  //   return roles.some(role => route.meta.roles.includes(role));
  // } else {
  //   return true;
  // }
  const menu = storage.getMenu() || [];
  console.log({ menu, name: route.name, route });
  // 直接对应 or 路由下有 children，就在 children 下查找
  return menu.findIndex(v => v.menuCode === route.name || (route.children && route.children.some(c => c.name === v.menuCode))) > -1 || route.path === "*";
}

/**
 * @description 通过递归筛选异步路由表
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = [];
  routes.forEach(route => {
    const tmp = { ...route };
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles);
      }
      res.push(tmp);
    }
  });

  return res;
}

const state = {
  routes: [],
  addRoutes: [],
};

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes;
    state.routes = constantRoutes.concat(routes);
  },
};

const actions = {
  // 产生路由
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      let accessedRoutes;
      if (roles.includes("admin")) {
        accessedRoutes = asyncRoutes || [];
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roles);
      }
      commit("SET_ROUTES", accessedRoutes);
      resolve(accessedRoutes);
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
