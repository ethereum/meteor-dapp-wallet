
Template['views_tokens'].events({
    /**
    Submit form

    @event submit form
    */
    'submit form': function(e) {
        var address = document.querySelector('[name=address]').value,
            symbol = document.querySelector('.symbol').value,
            division = document.querySelector('.division').value; 


        alert(address + " " + symbol + " " + division);
    }

})



        // var amount = TemplateVar.get('amount') || '0',
        //     to = TemplateVar.getFrom('.dapp-address-input', 'value'),
        //     data = TemplateVar.getFrom('.dapp-data-textarea', 'value');
        //     gasPrice = TemplateVar.getFrom('.dapp-select-gas-price', 'gasPrice'),
        //     estimatedGas = TemplateVar.get('estimatedGas'),
        //     selectedAccount = Helpers.getAccountByAddress(template.find('select[name="dapp-select-account"]').value);