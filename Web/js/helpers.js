let averySelected = false;
let numLabelsSelected = false;

window.onload = function() {

    $('.coming-soon').popup();
    $('.ui.dropdown').dropdown();
    $('.modal-invalid-upload').modal();

    $('#avery-select').change( function() {

    });

    $('#avery-select').change( function() {
        averySelected = true;
        if(numLabelsSelected == true) {
            $('#upload-button').removeClass('disabled');
        }
    });

    $('#num-labels-select').change( function() {
        numLabelsSelected = true;
        if(averySelected == true) {
            $('#upload-button').removeClass('disabled');
        }
    });


}

function onUploadXlsxButtonClick(files) {

    var file = files[0];

    $('#file-input')[0].value = "";
    
    if(file.length > 1) {
        showInvalidUploadModal();
        return;
    }

    if(file.size > 5000000) {
        showInvalidUploadModal();
        return;
    }

    $('.moves-malformed').css("display", "none");
    $('.processing-status').css("display", "inline");

    let avery = $('#avery-select').val();
    let numLabels = $('#num-labels-select').val();
    
    getBase64(file).then(

        data => $.ajax({
            method: "POST",
            url: "https://llxfr8g6q0.execute-api.us-east-1.amazonaws.com/default/convertMovesXlsxToPDF?avery=" + avery + "&numLabels=" + numLabels,
            data: data
        })
        .done(function(response){
            $('.processing-status').css("display", "none");
            if(response.Status == "Error") {
                $('.moves-malformed').css("display", "inline");
            } else {
                DownloadLabels(response.Url);
            }
            
        })
        .fail(function(){
            $('.processing-status').css("display", "none");
        })
        .catch(function(){
            $('.processing-status').css("display", "none");
        })

      );

}

function showInvalidUploadModal() {

    $('.modal-invalid-upload')
    .modal({
      inverted: true
    })
    .modal('show');
  
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result.replace(/^data:(.*;base64,)?/, '');
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  }
  