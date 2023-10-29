void (function () {
  class Chat {
    static SYMBOL = "_CHAT_SYMBOL_";
    static STATE_CONNECT = Chat.SYMBOL + "CONNECT";
    static STATE_OPEN = Chat.SYMBOL + "OPEN";
    static STATE_CLOSE = Chat.SYMBOL + "CLOSE";
    static JSON_DATA = Chat.SYMBOL + "type:json;";
    static GET_LATEST_MESSAGE = Chat.SYMBOL + "LATEST_MESSAGE";
    static PARENT_INFORMATION = Chat.SYMBOL + "PARENT_INFORMATION";

    static create(...args) {
      if (this.instance == null) {
        this.instance = new Chat(...args);
      }
      return this.instance;
    }
    static getInstance() {
      return this.instance;
    }

    constructor(url = "", safetySource) {
      this.url = url;
      this.readyState = Chat.STATE_CONNECT;
      this.listeners = [];
      this.close = this.listenerMessage();
      this.safetySource = safetySource || [];
      this.safetySource.push(url);
      if (!window.name) {
        window.name = url;
      }
    }
    listenerMessage() {
      const handler = (event) => {
        const { data, source } = event;
        // if (!this.safetySource.every((url) => url.startsWith(origin))) return;
        if (!data.startsWith(Chat.SYMBOL)) return;
        if (data === Chat.STATE_CONNECT) {
          this.source = source;
          if (this.readyState === Chat.STATE_CONNECT) {
            console.info("chat connected");
            this.readyState = Chat.STATE_OPEN;
            this.listeners.forEach(([cType, callback]) => {
              if (cType === "open") {
                callback();
              }
            });
          }
          console.info("keep alive");
          return;
        }
        if (data === Chat.STATE_CLOSE) {
          this.disconnect();
          this.listeners.forEach(([cType, callback]) => {
            if (cType === "close") {
              callback();
            }
          });
          return;
        }
        if (this.readyState === Chat.STATE_OPEN) {
          if (data === Chat.GET_LATEST_MESSAGE) {
            this.send(this.latestMessage);
            return;
          }
          if (data.startsWith(Chat.PARENT_INFORMATION)) {
            this.parentInformation = data;
            return;
          }

          this.listeners.forEach(([cType, callback]) => {
            if (cType === "message") {
              callback(data);
            }
          });
        }
      };
      const event = "message";
      window.addEventListener(event, handler);
      return () => {
        this.send(Chat.STATE_CLOSE);
        this.disconnect();
        window.removeEventListener(event, handler);
      };
    }
    on(cType, callback) {
      this.listeners.push([
        cType,
        (data) => {
          callback(data);
        },
      ]);
    }
    back() {
      const isTop = window.top === window;
      if (!isTop) return;
      const parentInformation = this.getParentInformation();
      if (parentInformation == null) return;
      if (!parentInformation.isTop) return;
      console.log(parentInformation);
      if (this.parent) {
        this.parent.focus();
      } else {
        this.parent = window.open(
          parentInformation.href + "#opened",
          parentInformation.name
        );
      }
    }
    open(target = this.url + Chat.SYMBOL, feature) {
      if (this.isChild()) {
        this.back();
        return;
      }
      if (this.opener && !this.opener.closed) {
        this.opener.focus();
        return;
      }

      // window.open("", target, feature);
      this.target = target;
      setTimeout(() => {
        this.opener = window.open(this.url, target, feature);
      });
      this.readyState = Chat.STATE_OPEN;
      this.connect();
    }
    connect() {
      this.disconnect();
      this.timer = setInterval(() => {
        console.info(this.readyState);
        if (this.opener?.closed) {
          this.disconnect();
          return;
        }
        this.send(Chat.STATE_CONNECT);
        this.sendParentInformation();
      }, 500);
    }
    sendParentInformation() {
      const isTop = window.top === window;
      const data = {
        isTop,
        href: window.location.href,
        name: window.name,
      };
      this.send(Chat.PARENT_INFORMATION + JSON.stringify(data));
    }
    getParentInformation() {
      if (this.parentInformation) {
        return JSON.parse(
          this.parentInformation.replace(Chat.PARENT_INFORMATION, "")
        );
      }
    }
    disconnect() {
      clearInterval(this.timer);
    }
    send(data) {
      const poster = this.opener || this.source;
      poster?.postMessage(data, "*");

      const stack = [this.opener?.frames];

      while (stack.length) {
        const frames = stack.pop();
        if (frames == null) continue;
        const len = frames.length;
        for (let i = 0; i < len; i++) {
          const current = frames[i];
          current.postMessage(data, "*");
          if (current.frames.length) {
            stack.push(current.frames);
          }
        }
      }
    }
    isChild() {
      if (this.opener) return false;
      if (this.source?.closed) return false;
      return this.readyState === Chat.STATE_OPEN;
    }
    onMessage(callback) {
      this.on("message", (data = "") => {
        if (!data.startsWith(Chat.JSON_DATA)) return;
        data = data.replace(Chat.JSON_DATA, "");
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.info(e);
        }
        callback(data);
      });
    }
    sendMessage(data) {
      if (data && typeof data === "object") {
        data = Chat.JSON_DATA + JSON.stringify(data);
      }
      this.send(data);
      this.latestMessage = data;
    }
    getLatestMessage(clear) {
      this.send(Chat.GET_LATEST_MESSAGE);
    }
  }

  window.Chat = Chat;
})();
