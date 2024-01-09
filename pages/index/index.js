import mqtt from "../../utils/mqtt.min.js";

Page({
  data: {
    client: null,
    conenctBtnText: "连接",
    host: "broker-cn.emqx.io",
    subTopic: "miniprogram/thermohygrometer",
    pubTopic: "miniprogram/thermohygrometer",
    pubMsg: '{"Temperature": 25.0, "Humidity": 50.0}',
    receivedMsg: "",
    //temperature: "",
    //humidity: "",
    displayCurrMsg: "<br/><br/>",
    mqttOptions: {
      username: "test",
      password: "test",
      reconnectPeriod: 1000, // 1000毫秒，设置为 0 禁用自动重连，两次重新连接之间的间隔时间
      connectTimeout: 30 * 1000, // 30秒，连接超时时间
    },
  },

  setValue(key, value) {
    this.setData({
      [key]: value,
    });
  },
  setHost(e) {
    this.setValue("host", e.detail.value);
  },
  setSubTopic(e) {
    this.setValue("subTopic", e.detail.value);
  },
  setPubTopic(e) {
    this.setValue("pubTopic", e.detail.value);
  },
  setPubMsg(e) {
    this.setValue("pubMsg", e.detail.value);
  },
  setRecMsg(msg) {
    this.setValue("receivedMsg", msg);
  },

  connect() {
    try {
      this.setValue("conenctBtnText", "连接中...");
      const clientId = new Date().getTime();
      this.data.client = mqtt.connect(`wxs://${this.data.host}:8084/mqtt`, {
        ...this.data.mqttOptions,
        clientId,
      });

      this.data.client.on("connect", () => {
        wx.showToast({
          title: "连接成功",
        });
        this.setValue("conenctBtnText", "连接成功");

        this.data.client.on("message", (topic, payload) => {
          const currMsg = this.data.receivedMsg ? `<br/>${payload}` : payload;
          var resData = `${payload}`.replace(/"/g, "").replace("{", "").replace("}", "").replace(/, /g, "<br/>").replace("Temperature", "温度🌡️").replace("Humidity", "湿度💧");
          this.setValue("receivedMsg", this.data.receivedMsg.concat(currMsg));
          this.setValue("displayCurrMsg", resData);
        });

        this.data.client.on("error", (error) => {
          this.setValue("conenctBtnText", "连接");
          console.log("onError", error);
        });

        this.data.client.on("reconnect", () => {
          this.setValue("conenctBtnText", "连接");
          console.log("reconnecting...");
        });

        this.data.client.on("offline", () => {
          this.setValue("conenctBtnText", "连接");
          console.log("onOffline");
        });
      });
    } catch (error) {
      this.setValue("conenctBtnText", "连接");
      console.log("mqtt.connect error", error);
    }
  },

  subscribe() {
    if (this.data.client) {
      this.data.client.subscribe(this.data.subTopic);
      wx.showModal({
        content: `成功订阅主题：${this.data.subTopic}`,
        showCancel: false,
      });
      return;
    }
    wx.showToast({
      title: "请先点击连接",
      icon: "error",
    });
  },

  unsubscribe() {
    if (this.data.client) {
      this.data.client.unsubscribe(this.data.subTopic);
      wx.showModal({
        content: `成功取消订阅主题：${this.data.subTopic}`,
        showCancel: false,
      });
      return;
    }
    wx.showToast({
      title: "请先点击连接",
      icon: "error",
    });
  },

  publish() {
    if (this.data.client) {
      this.data.client.publish(this.data.pubTopic, this.data.pubMsg);
      return;
    }
    wx.showToast({
      title: "请先点击连接",
      icon: "error",
    });
  },

  disconnect() {
    this.data.client.end();
    this.data.client = null;
    this.setValue("conenctBtnText", "连接");
    wx.showToast({
      title: "成功断开连接",
    });
  },
});
