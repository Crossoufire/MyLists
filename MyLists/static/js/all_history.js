

// --- Datatable functions -----------------------------------------------------------------------------
$(document).ready(function () {
    $('#all-history').DataTable({
        "bPaginate": true,
        "bLengthChange": true,
        "bFilter": true,
        "bInfo": true,
        "bAutoWidth": false,
        "searching": true,
        columnDefs: [
            {orderable: false, targets: 0},
            {orderable: true, targets: 1},
            {orderable: false, targets: 2},
            {orderable: true, targets: 3}
        ],
    });
    $('.dataTables_length').addClass('bs-select');
});
