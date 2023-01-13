var cc = DataStudioApp.createCommunityConnector();


//////////////////////getAuth
function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}


///////////////////////getConfig
function getConfig(request) {
  var config = cc.getConfig();
  
  config.newInfo()
    .setId('instructions')
    .setText('Enter currency you are interested in.');
  
  config.newTextInput()
    .setId('currencyCode')
    .setName('ISO 4217 currency code')
    .setHelpText('e.g. USD or EUR')
    .setPlaceholder('EUR');

  config.setDateRangeRequired(true);
  
  return config.build();
}

/////////////////////////////getSchema
function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  
  fields.newDimension()
            .setId('effectiveDate')
            .setName('effectiveDate')
            .setDescription('date')
            .setType(types.YEAR_MONTH_DAY);
  
  fields.newMetric()
    .setId('mid')
    .setName('value')
    .setType(types.CURRENCY_PLN);
  
  return fields;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}


///////////////////////////getData
function getData(request) {
    var currencyCode = request.configParams.currencyCode;
    var startDate = request.dateRange.startDate;
    var endStart = request.dateRange.endDate;

    var requestedFieldIds = request.fields.map(function(field) {
        return field.name;
    });
    var requestedFields = getFields().forIds(requestedFieldIds);

    var returnRows = {
        schema: requestedFields.build(),
        rows: []
    };

    var url = [
      'https://api.nbp.pl/api/exchangerates/rates/A', currencyCode, startDate, endStart, '?format=json'
    ];

    try {
        var response = UrlFetchApp.fetch(url.join('/'));
    } catch (err) {
        return false;
    }

    var rates = JSON.parse(response).rates;


    rates.forEach(function(rate){
      var newRow = [];
      requestedFieldIds.forEach(function(fieldName){
        if(fieldName == 'effectiveDate') {
          newRow.push(rate[fieldName].replace(/-/g, ''))
        } else {
          newRow.push(rate[fieldName])
        }
      })
      returnRows.rows.push({values: newRow});
    });

    return returnRows;

}

function isAdminUser() { return true;}
