CoinBaseWidget = function(buttonElem, params) {
    var self = this;

    self.domain = "https://buy.coinbase.com";
    
    self.show = function() {
        // self.button.trigger('click');
        self.modal.style.display = "block";
    };

    self.generateIframe = function(content) {
        var e = document.createElement("div");
        return e.innerHTML = content, e.firstChild;
    };

    self.generateParams = function() {
        return "?address=" + encodeURIComponent(params.address) + ("&amount=" + encodeURIComponent(params.amount)) + ("&code=" + encodeURIComponent(params.code)) + ("&currency=" + encodeURIComponent(params.currency)) + ("&crypto_currency=" + encodeURIComponent(params.crypto_currency)) + ("&state=" + encodeURIComponent(params.state));
    };

    self.modalIframeStyle = function() {
        return "\n      transition: all 0.3s ease-out;\n      background-color: transparent;\n      border: 0px none transparent;\n      display: none;\n      position: fixed;\n      visibility: visible;\n      margin: 0px;\n      padding: 0px;\n      left: 0px;\n      top: 0px;\n      width: 100%;\n      height: 100%;\n      z-index: 9999;\n    ";
    };

    self.modalIframe = function() {
        var e = self.generateParams();
        return "<iframe src='" + self.domain + "/" + e + "'\n                    id='coinbase_modal_iframe'\n                    name='coinbase_modal_iframe'\n                    style='" + self.modalIframeStyle() + "'\n                    scrolling='no'\n                    allowtransparency='true' frameborder='0'>\n      </iframe>";
    };

    // self.buttonIframeStyle = function() {
    //     return "\n      width: 273px;\n      height: 53px;\n      border: none;\n      overflow: hidden;\n      display: none;\n      border-radius: 5px;\n    "
    // };

    // self.buttonParams = function() {
    //     return "?crypto_currency=" + encodeURIComponent(params.crypto_currency);
    // };

    // self.buttonIframe = function() {
    //     var e = self.buttonParams();
    //     return "<iframe src='" + self.domain + "/button" + e + "'\n                    id='coinbase_button_iframe'\n                    name='coinbase_button_iframe'\n                    style='" + self.buttonIframeStyle() + "'\n                    scrolling='no'\n                    allowtransparency='true'\n                    frameborder='0'>\n      </iframe>";
    // };

    self.handleMessage = function(e) {
        // Only trust Coinbase with messages
        if (e.origin !== "https://buy.coinbase.com")
            return;

        console.debug(e);
        trackJs.track(e.data);

        switch (e.data.event) {
            case "modal_closed":
                self.modal.style.display = "none";

                break;
            // case "button_clicked":
            //     self.modal.style.display = "block";
            // case "button_loaded":
            //     buttonElem.parentNode.removeChild(buttonElem);
            //     self.button.style.display = null;
            //     break;
        }
    };

    self.modal = self.generateIframe(self.modalIframe());
    document.body.appendChild(self.modal);

    // self.button = self.generateIframe(self.buttonIframe());
    // buttonElem.parentNode.appendChild(self.button);

    window.addEventListener("message", self.handleMessage, !1)
};
