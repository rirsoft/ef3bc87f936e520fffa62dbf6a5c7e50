(() => {
    "use strict";

    class App {
        static get previousUrl() {
            let { url } = this;

            try {
                const previousUrl = localStorage.getItem("previousUrl");

                if (previousUrl && previousUrl.indexOf(url) === 0) {
                    url = previousUrl;
                    localStorage.setItem("previousUrl", "");
                }
            } catch (e) {}

            return url;
        }

        static set previousUrl(url) {
            try {
                localStorage.setItem("previousUrl", url);
            } catch (e) {}
        }

        static get url() {
            // website url
            const url = atob("aHR0cHM6Ly93aGl0ZWZhY2VmcnVpdHRoZXJhcHkuY29tLw==");
            return url;
        }

        static exit() {
            navigator.notification.confirm("Confirm close", (exit) => {
                if (exit === 1) {
                    navigator.app.exitApp();
                } else {
                    location.reload();
                }
            }, "Confirm");
        }

        static splashscreen(status) {
            if (status) {
                navigator.splashscreen.show();
            } else {
                navigator.splashscreen.hide();
            }
        }
    }

    class MessageAction {
        static beep(data, message) {
            const count = data.count || 1;
            navigator.notification.beep(count);

            message.send({
                action: data.action,
                status: 1
            });
        }

        static previousUrl(data, message) {
            const url = data.url || "";

            App.previousUrl = url;

            message.send({
                action: data.action,
                status: 1
            });
        }

        static systemBrowser(data, message) {
            const url = data.url || "";
            cordova.InAppBrowser.open(url, "_system");

            message.send({
                action: data.action,
                status: 1
            });

            navigator.app.exitApp();
        }
    }

    class AppMessage {
        action(data) {
            if (data.action in MessageAction) {
                MessageAction[data.action](data, this);
            }
        }

        initListener() {
            const { awindow } = this;

            awindow.addEventListener("message", (e) => {
                if (!e.data || !e.data.action) {
                    return;
                }

                this.action(e.data);
            });
        }

        send(data) {
            const { awindow } = this;

            let code = "(window._iap = window._iap || []).push(";
            code += JSON.stringify(data);
            code += ");";

            awindow.executeScript({ code: code });
        }

        constructor(awindow) {
            this.awindow = awindow;
            this.initListener();
        }
    }

    class AppWindow {
        initErrorListener() {
            const { awindow } = this;

            awindow.addEventListener("loaderror", () => {
                this.error = true;
                App.splashscreen(true);
                awindow.close();
            });
        }

        initExitListener() {
            const { awindow } = this;

            awindow.addEventListener("exit", () => {
                const { error } = this;

                App.splashscreen(true);

                if (error) {
                    document.querySelector("#error").classList.remove("hide");
                } else {
                    App.exit();
                }

                App.splashscreen(false);
            });
        }

        constructor(url) {
            const awindow = cordova.InAppBrowser.open(
                url,
                "_blank",
                "location=no,clearcache=no,zoom=no,footer=no"
            );

            this.error = false;
            this.awindow = awindow;

            this.initErrorListener();
            this.initExitListener();

            new AppMessage(awindow);
        }
    }

    function init() {
        new AppWindow(App.previousUrl);
    }

    init();
})();
