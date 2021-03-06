import axios from "axios";
import { Message } from "element-ui";
import store from "@/store";
// import { getToken } from "@/utils/auth"; // 把 token 放进 localStorage 中：const TokenKey = "Admin-Token";
import qs from "qs";
import appConfig from "@/config/index";
import storage from "@/utils/storage/index";

// 创建 axios 实例
const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // 当跨域请求发送cookie
  timeout: 20000, // 请求超时
  validateStatus(status) {
    switch (status) {
      case 400:
        Message.error("请求出错");
        break;
      case 401:
        Message.warning({
          message: "授权失败，请重新登录",
        });
        // store.commit('LOGIN_OUT');
        // setTimeout(() => {
        //     window.location.reload();
        // }, 1000);
        return;
      case 403:
        Message.warning({
          message: "拒绝访问",
        });
        break;
      case 404:
        Message.warning({
          message: "请求错误,未找到该资源",
        });
        break;
      case 500:
        Message.warning({
          message: "服务端错误",
        });
        break;
      default:
        break;
    }
    return status >= 200 && status < 300;
  },
});

// post请求头
// service.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";

// 请求拦截器
service.interceptors.request.use(
  config => {
    if (!(config.url.includes("/user") || config.url.includes("/role"))) {
      config.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";
    }

    if (config.url.includes("/user/delUsers") || config.url.includes("/role/list")) {
      config.headers.post["Content-Type"] = "application/x-www-form-urlencoded;";
    }

    if (config.url.includes("/menu/addMenu")) {
      config.headers.post["Content-Type"] = "application/json;";
    }

    if (config.url.includes("/updateBaseMesh")) {
      config.headers.post["Content-Type"] = "application/json;";
    }

    // 在发送请求之前做的事情
    // 如果 Vuex 中有token
    if (store.getters.token) {
      // 让当前请求携带token令牌
      // ['X-Token'] 是一个自定义 headers key
      // 根据实际情况修改此key
      config.headers["Authorization"] = storage.getToken();
    }
    return config;
  },
  error => {
    // 请求出错后做的事情
    console.log(error); // for debug
    return Promise.reject(error);
  },
);

// response interceptor
service.interceptors.response.use(
  /**
   * 如果你想获得http的 headers 或 status 等信息
   * 需要 return  response => response
   */

  /**
   * 根据后端自定义code来判断响应状态
   * 下面只是个例子
   * 你也可以通过HTTP状态码来判断
   */
  response => {
    // res：真正的data
    const res = response.data;
    const code = Number(res.resCode || res.code);
    const msg = res.msg;
    let result = res.data;

    // 不是10000，不管data是啥，return null
    if (code !== 10000) {
      Message.warning({
        message: msg || "出错了 o(╥﹏╥)o，请稍后重试",
      });
      return Promise.resolve([msg, undefined]);
    } else {
      // 请求成功，data为null
      if (result == null) {
        result = true;
      }
    }

    // 1. code === 10000;
    //  1.1 result为null;return true
    //  1.2 result不是null,return对应值
    // 2. code !== 10000;
    //  1.1 不管result是什么，都return null
    return Promise.resolve([undefined, res.data]);
  },
  error => {
    // 异常处理
    console.log("err" + error); // for debug
    let msg = "";
    const { code, message } = error;
    if (code === "ECONNABORTED" || message === "Network Error") {
      msg = "出错了 o(╥﹏╥)o，请稍后重试";
    } else {
      msg = error.message;
    }

    Message({
      message: msg,
      type: "error",
      duration: 5 * 1000,
    });
    return Promise.resolve([error, undefined]);
  },
);

// 包装请求
let request = {};
const base = appConfig.baseURL; // url = base url + request url
request.get = (url, params, baseURL = base) => {
  return service.get(url, { params, baseURL });
};
request.post = (url, params, baseURL = base) => {
  // service.defaults.headers["Content-Type"] = "application/x-www-form-urlencoded;";
  return service.post(
    url,
    // mock环境下，直接传data: params 的形式
    // https://github.com/PanJiaChen/vue-element-admin/issues/1478#issuecomment-450476984
    // qs.stringify(params) 配合上边注释的 ["Content-Type"] = "application/x-www-form-urlencoded;"; 使用
    // 如果不设置 application/x-www-form-urlencoded; 则都用 params ，不用qs转
    url.includes("/user") || url.includes("/role") || url.includes("/menu")
      ? url.includes("/role/list") || url.includes("/user/delUsers") || url.includes("/menu/updateMenu")
        ? qs.stringify(params)
        : params
      : url.includes("/updateBaseMesh")
      ? params
      : qs.stringify(params),
    { baseURL },
  );
};
request.put = (url, params, baseURL = base) => {
  return service.put(url, params, { baseURL });
};
// axios delete 没有 params 参数，传参要么直接放url后面，要么通过 config 的 data 传入
request.delete = (url, params, baseURL = base) => {
  return service.delete(url, {
    baseURL,
    data: params,
  });
};

export default request;
