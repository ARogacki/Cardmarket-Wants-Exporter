// ==UserScript==
// @name         Cardmarket Wants Exporter
// @namespace    https://github.com/ARogacki
// @version      0.2
// @description  Export the contents of cardmarket wants lists in the form of a .txt file.
// @author       Darks001
// @match        https://www.cardmarket.com/*/Magic/Wants/*
// @match        https://www.cardmarket.com/*/Magic/Orders/*
// @match        https://www.cardmarket.com/*/Magic/Wants/ShoppingWizard/Results/*
// @match        https://www.cardmarket.com/*/Magic/ShoppingCart
// @grant        none
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

function CreateTextFile(list) {
    var fileName = $('.page-title-container').find('div').find('h1').length ?
        fileName = $('.page-title-container').find('div').find('h1').text() + '.txt' :
        'CardmarketList.txt'
    var textToWrite = list
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    });
    var downloadLink = document.createElement('a');
    downloadLink.download = fileName;
    downloadLink.innerHTML = 'Download File';
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    downloadLink.click();
    downloadLink.remove();
}

function CopyToClipboard(list, tableInterface) {
    navigator.clipboard.writeText(list).then(
        function() {
            tableInterface.message.css('color', 'green');
            tableInterface.message.text('Successfully copied to clipboard.');
        },
        function() {
            tableInterface.message.css('color', 'red');
            tableInterface.message.text('Failed to copy to clipboard.');
        });
}

function GetCardListClueless(row, output) {
    var data = $(row).find('td');
    !output[data.eq(2).text()] ?
        output[data.eq(2).text()] += parseInt(data.eq(1).text()) :
        output[data.eq(2).text()] = parseInt(data.eq(1).text());
}

function GetCardListByClassNames(row, output) {
    var amount = parseInt($(row).find('.amount').text().replace('x', ''));
    output[$(row).find('.name').find('a').text()] ?
        output[$(row).find('.name').find('a').text()] += amount :
        output[$(row).find('.name').find('a').text()] = amount;
}

function ExportList(table) {
    var rows = table.find('table').find('tbody').find('tr');
    var cardNames = '';
    var list = {};

    rows.each(function() {
        if (!$(this).find('.amount').length) {
            GetCardListClueless(this, list);
        }
        else {
            GetCardListByClassNames(this, list);
        }
    });
    $.each(list, function(key, value) {
        cardNames += value + ' ' + key + '\n';
    });
    return cardNames;
}

function ExportListToFile(table) {
    var cardNames = ExportList(table);
    CreateTextFile(cardNames);
}

function CopyListToClipboard(table) {
    var cardNames = ExportList(table);
    CopyToClipboard(cardNames, this);
}

function CreateTableInterface(table) {
    var exportToFileButton = $('<input type="button" class="btn btn-primary ml-lg-3 mt-2 mt-lg-0" value="Export list to file"/>');
    var copyToClipboardButton = $('<input type="button" class="btn btn-primary ml-lg-3 mt-2 mt-lg-0" value="Copy list to clipboard"/>');
    var copyMessage = $('<div class="clipboardMessage">&nbsp</div>');

    var tableInterface = {
        'export': exportToFileButton,
        'clipboard': copyToClipboardButton,
        'message': copyMessage
    };
    exportToFileButton.click(ExportListToFile.bind(tableInterface, table));
    copyToClipboardButton.click(CopyListToClipboard.bind(tableInterface, table));
    return tableInterface;
}

function PrepareButtonsBeforeTable(table) {
    var tableInterface = CreateTableInterface(table);

    table.prepend(tableInterface.message);
    table.prepend(tableInterface.clipboard);
    table.prepend(' ');
    table.prepend(tableInterface.export);
}

function PrepareButtonsAfterTable(table) {
    var tableInterface = CreateTableInterface(table);

    table.append(tableInterface.export);
    table.prepend(' ');
    table.append(tableInterface.clipboard);
    table.append(tableInterface.message);
}

$(document).ready(function() {
    SetupWantsTableExports();
    SetupShoppingCartExports();
    SetupTransactionResultsExports();
});

function SetupWantsTableExports() {
    if (!$('#WantsListTable').length) {
        return;
    }
    PrepareButtonsBeforeTable($('#WantsListTable'));
}

function SetupShoppingCartExports() {
    if (!$('.category-subsection').length) {
        return;
    }
    var tables = $('.category-subsection');
    tables.each(function() {
        PrepareButtonsBeforeTable($(this));
    });
}

function SetupTransactionResultsExports() {
    if (!$('#ShoppingWizardResult').length) {
        return;
    }
    var tables = $('.card');
    tables.each(function() {
        PrepareButtonsAfterTable($(this));
    });
}
