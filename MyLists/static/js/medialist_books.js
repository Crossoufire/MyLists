
// --- Create the buttons category list -----------------------------------------------------------------
function chargeButtons(card) {
    removeCat();

    let dis_reading = "block;";
    let dis_completed = "block;";
    let dis_on_hold = "block;";
    let dis_dropped = "block;";
    let dis_plan_to_read = "block;";
    let $card = $('#'+card.id);
    let category = $card.attr('cat');

    if (category === 'Reading') {
        dis_reading = "none;";
    }
    else if (category === 'Completed') {
        dis_completed = "none;";
    }
    else if (category === 'On Hold') {
        dis_on_hold = "none;";
    }
    else if (category === 'Dropped') {
        dis_dropped = "none;";
    }
    else if (category === 'Plan to Read') {
        dis_plan_to_read = "none;";
    }

    $card.find('.view.overlay').prepend(
        '<a class="card-btn-top-right fas fa-times" onclick="removeCat()"></a>' +
        '<ul class="card-cat-buttons">' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile" style="display: '+dis_reading+'" ' +
            'onclick="changeCategory(\'Reading\', \''+card.id+'\')">' +
                'Reading' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile" style="display: '+dis_completed+'" ' +
            'onclick="changeCategory(\'Completed\', \''+card.id+'\')">' +
                'Completed' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile" style="display: '+dis_on_hold+'" ' +
            'onclick="changeCategory(\'On Hold\', \''+card.id+'\')">' +
                'On Hold' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile" style="display: '+dis_dropped+'" ' +
            'onclick="changeCategory(\'Dropped\', \''+card.id+'\')">' +
                'Dropped' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile" style="display: '+dis_plan_to_read+'" ' +
            'onclick="changeCategory(\'Plan to Read\', \''+card.id+'\')">' +
                'Plan to Read' +
            '</li>' +
        "</ul>");

    $card.find('.card-btn-toop-right').hide();
    $card.find('.card-btn-top-left').hide();
    $card.find('.bottom-card-cat').hide();
    $card.find('.bottom-card-info').hide();
    $card.find('.card-img-top').attr('style', 'filter: brightness(20%); height: auto;');
    $card.find('.mask').hide();
}


// --- Change the category ------------------------------------------------------------------------------
function changeCategory(new_category, card_id) {
    removeCat();

    let $card = $('#'+card_id);
    let media_type = $card.attr('values').split('-')[1];
    let element_id = $card.attr('values').split('-')[2];
    let load_img = $card.find('.view.overlay');
    load_img.prepend(Loading());

    $.ajax ({
        type: "POST",
        url: "/update_category",
        contentType: "application/json",
        data: JSON.stringify({status: new_category, element_id: element_id, element_type: media_type }),
        dataType: "json",
        success: function() {
            $card.remove();
        },
        error: function () {
            error_ajax_message('Error trying to change the media category. Please try again later.')
        },
        complete: function () {
            removeCat();
            load_img.find('.load-medialist').remove();
        }
    });
}


// --- Charge the categories buttons from other lists ---------------------------------------------------
function ChargeButtonsOther(card) {
    removeCat();

    $(card).find('.view.overlay').prepend(
        '<a class="card-btn-top-right fas fa-times" onclick="removeCat()"></a>' +
        '<ul class="card-cat-buttons">' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile\" style="display: block;" ' +
            'onclick="AddCatUser(\'Reading\', \''+card.id+'\')">' +
                'Reading' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile\" style="display: block;" ' +
            'onclick="AddCatUser(\'Completed\', \''+card.id+'\')">' +
                'Completed' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile\" style="display: block;" ' +
            'onclick="AddCatUser(\'On Hold\', \''+card.id+'\')">' +
                'On Hold' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile\" style="display: block;" ' +
            'onclick="AddCatUser(\'Dropped\', \''+card.id+'\')">' +
                'Dropped' +
            '</li>' +
            '<li class="btn btn-light p-1 m-1 card-btn-mobile\" style="display: block;" ' +
            'onclick="AddCatUser(\'Plan to Read\', \''+card.id+'\')">' +
                'Plan to Read' +
            '</li>' +
        "</ul>");

    $(card).find('.card-btn-top-left').hide();
    $(card).find('.bottom-card-info').hide();
    $(card).find('.bottom-card-cat').hide();
    $(card).find('.card-img-top').attr('style', 'filter: brightness(20%); height: auto;');
    $(card).find('.mask').hide();
}


// --- Update pages -------------------------------------------------------------------------------------
function updatePages(element_id, input_page) {
    let page = input_page.value;
    let check_img = $('<div style="position: absolute; z-index: 200; top: 65%; width: 100%;' +
        'background-color: black; opacity: 0.60;">' +
        '<div class="central-loading fas fa-2x fa-check" style="color: green;"></div>' +
        '</div>');

    $.ajax ({
        type: "POST",
        url: "/update_page",
        contentType: "application/json",
        data: JSON.stringify({page: page, element_id: element_id, element_type: 'bookslist'}),
        dataType: "json",
        success: function() {
            check_img.prependTo($('#card_'+element_id).find('.view.overlay'));
            check_img.delay(800).fadeOut(300, function() { this.remove(); });
        },
        error: function () {
            error_ajax_message("Error updating the media's episode. Please try again later.")
        }
    });
}

