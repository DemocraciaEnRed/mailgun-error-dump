var DOMAIN = 'DOMAIN_MAILGUN';
var mailgun = require('mailgun-js')({ apiKey: "PRIVATE_API_KEY", domain: DOMAIN });

const REGISTROS=[]
let PAGINA=1

function recursePage(pageUrl){
  // las url del paging son de la forma:
  // https://api.mailgun.net/v3/mg.democracyos.org/events/WzMseyJ_CODIGO_RARO
  mailgun.get(pageUrl.split('/v3')[1], function (error, body) {
    if (error){
      console.error(error);
      return
    }

    const { items, paging } = body
    const pageUrl = paging.next

    if (!items || !items.length){
      console.log('Fin de páginas')
      dump_csv()
      return
    }

    console.log('~ Página', PAGINA++)
    dump_items(items)

    recursePage(pageUrl)
  })
}

function dump_items(items){
  items.forEach((item) => {
    //console.log(item)
    const { event, severity, timestamp, recipient, message } = item
    const deliveryStatus = item['delivery-status']
    const errorCode = deliveryStatus.code
    const errorMsg = deliveryStatus.message
    let subject = message.headers.subject.trim()
    let date = new Date(timestamp * 1000);
    //console.log(event, severity, recipient, date, errorCode, errorMsg)

    // pasamos a GMT-3
    date.setHours(date.getHours() - 3);

    let operacion;
    if (subject == 'Bienvenido al Presupuesto Participativo')
      operacion = 'Registro'
    else if (subject == 'Reestablecer contraseña')
      operacion = 'Reestablecer contraseña'
    else
      operacion = subject

    let motivo;
    if ([450, 554, 498, 550, 605, 602, 533, 552, 553, 612, 530].includes(errorCode))
      // 450 Sender address rejected: Domain not found
      // 554 Por favor, utilize el servidor de correo de su proveedor
      // 498 No MX for .edu.ar
      // 550 Requested action not taken: mailbox unavailable
      // 605 <vacío/sin mensaje de error>
      // 602 Too old
      // 553 sorry, your envelope sender domain must exist
      // 552 mail action aborted, mailbox not found
      // 553 sorry, your envelope sender domain must exist
      // 612 unable to connect to MX servers:
      // 530 (hotmail) 5.7.1 Authentication required
      motivo = 'Casilla inválida'
    else if (errorCode == 451)
      // 451 (hotmail) The mail server [*.*.*.*] has been temporarily rate limited due to IP reputation.
      motivo = 'Bloqueado por hotmail'
    else if (errorCode == 421)
      // 421 (gmail) 4.3.0 Temporary System Problem.  Try again later (5). - gsmtp
      motivo = 'Gmail estaba caído'
    else if (errorCode == 452)
      // 452 (gmail) 4.2.2 The email account that you tried to reach is over quota.
      motivo = 'Casilla llena'
    else
      motivo = errorMsg

    REGISTROS.push({
      fecha: date.toISOString(),
      email: recipient,
      errorCode,
      motivo,
      operacion
    })
  })
}

function dump_csv(){
  // https://www.programminghunk.com/2020/07/reading-and-parsing-csv-data-with-nodejs.html
  const fileName = 'Reporte de errores en envíos de mails.csv'
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      {id: 'fecha', title: 'Fecha'},
      {id: 'email', title: 'Email'},
      {id: 'errorCode', title: 'Código de falla'},
      {id: 'motivo', title: 'Motivo de falla'},
      {id: 'operacion', title: 'Operación en plataforma'},
    ]
  });
  csvWriter
    .writeRecords(REGISTROS)
    .then(()=> console.log(`Reporte creado exitosamente en "${fileName}"`));
}

// Events - https://documentation.mailgun.com/en/latest/api-events.html#event-types
mailgun.get(`/${DOMAIN}/events`, {
  // Date Format - https://documentation.mailgun.com/en/latest/api-intro.html#date-format
  "begin": "Thu, 10 Dec 2020 00:00:00 -0000",
  //"begin": "Mon, 14 Dec 2020 20:00:00 -0000",
  "ascending": "yes",
  "limit": 300,
  "event": "rejected OR failed"
},  function (error, body) {
  if (error){
    console.error(error);
    return
  }

  const { items, paging } = body
  const pageUrl = paging.next

  console.log('~ Página', PAGINA++)
  dump_items(items)

  recursePage(pageUrl)
});
