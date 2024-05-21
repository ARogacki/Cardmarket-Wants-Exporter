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
var buttonSize = 20;

function CreateTextFile(list) {
    var fileName = $('.page-title-container').find('div').find('h1').length 
        ? fileName = $('.page-title-container').find('div').find('h1').text() + '.txt' 
        :'CardmarketList.txt';
    var textFileAsBlob = new Blob([list], {
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
    var cardName = data.eq(2).text();
    var quantity = parseInt(data.eq(1).text());
    output[cardName]
        ? output[cardName] += quantity
        : output[cardName] = quantity;
}

function GetCardListByClassNames(row, output) {
    var cardName = $(row).find('.name').find('a').text();
    var quantity = parseInt($(row).find('.amount').text().replace('x', ''));
    output[cardName] 
        ? output[cardName] += quantity 
        : output[cardName] = quantity;
}

function ExportList(table) {
    var rows = table.find('table').find('tbody').find('tr');
    var cardNames = '';
    var list = {};

    rows.each(function() {
        $(this).find('.amount').length
            ? GetCardListByClassNames(this, list)
            : GetCardListClueless(this, list);
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

    table.before(tableInterface.message);
    table.before(tableInterface.clipboard);
    table.before(' ');
    table.before(tableInterface.export);
}

function PrepareButtonsAfterTable(table) {
    var tableInterface = CreateTableInterface(table);

    table.after(tableInterface.message);
    table.after(tableInterface.export);
    table.after(' ');
    table.after(tableInterface.clipboard);
}

function ResizeElement(element, adjustment){
    return parseFloat(element.replace("px", "")) + adjustment + "px"
}

function AdjustCardPlacement(card, adjustment) {
    card.style.top = ResizeElement(card.style.top, adjustment);
}

$(document).ready(function() {
    SetupWantsTableExports();
    SetupShoppingCartExports();
    SetupShoppingWizardExports();
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

function SetupShoppingWizardExports() {
    if (!$('#ShoppingWizardResult').length) {
        return;
    }

    var tables = $('.card');
    var leftIndex = 0;
    var rightIndex = 0;

    tables.each(function() {
        PrepareButtonsAfterTable($(this));
        if(this.parentNode.style.left == "0%") {
            AdjustCardPlacement(this.parentNode, buttonSize * leftIndex);
            leftIndex += 1;
        }
        else {
            AdjustCardPlacement(this.parentNode, buttonSize * rightIndex);
            rightIndex += 1;
        }
    });

    var section = tables[0].parentNode.parentNode;
    section.style.height = ResizeElement(section.style.height, buttonSize * Math.max(leftIndex, rightIndex));
}
