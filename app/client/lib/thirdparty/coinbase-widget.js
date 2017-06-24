CoinBaseWidget = function(buttonElem, params) {
    var self = this;

    self.domain = "https://buy.coinbase.com";

    self.show = function() {
        self.modal.style.display = "block";
    };

    self.generateIframe = function(content) {
        var e = document.createElement("div");
        return e.innerHTML = content, e.firstChild;
    };

    self.generateParams = function() {
        return "?address=" + encodeURIComponent(params.address) + ("&code=" + encodeURIComponent(params.code)) + ("&currency=" + encodeURIComponent(params.currency)) + ("&crypto_currency=" + encodeURIComponent(params.crypto_currency)) + ("&state=" + encodeURIComponent(params.state));
    };

    self.modalIframeStyle = function() {
        return "\n      transition: all 0.3s ease-out;\n      background-color: transparent;\n      border: 0px none transparent;\n      display: none;\n      position: fixed;\n      visibility: visible;\n      margin: 0px;\n      padding: 0px;\n      left: 0px;\n      top: 0px;\n      width: 100%;\n      height: 100%;\n      z-index: 9999;\n    ";
    };

    self.modalIframe = function() {
        var e = self.generateParams();
        return "<iframe src='" + self.domain + "/" + e + "'\n                    id='coinbase_modal_iframe'\n                    name='coinbase_modal_iframe'\n                    style='" + self.modalIframeStyle() + "'\n                    scrolling='no'\n                    allowtransparency='true' frameborder='0'>\n      </iframe>";
    };

    self.handleMessage = function(e) {
        // Only trust Coinbase with messages
        if (e.origin !== self.domain)
            return;

        console.debug(e.data);

        switch (e.data.event) {
            case "modal_closed":
                self.modal.style.display = "none";
                break;
            case "buy_completed":
                self.modal.style.display = "none";
                window.alert("Your purchased Ether will be added to your account (" + e.data.address + "). Make sure you wallet is in sync with ethereum network.")
                break;
        }
    };

    self.modal = self.generateIframe(self.modalIframe());
    document.body.appendChild(self.modal);

    window.addEventListener("message", self.handleMessage, !1)
};
