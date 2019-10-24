const path = require('path');
const fs = require('fs');
const moment = require('moment');
const React = require('react');
const bwipjs = require('bwip-js');
const {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
} = require('@react-pdf/renderer');

const PdfTemplate = require('./PdfTemplate');

Font.register({
  family: 'noto-sans',
  fonts: [
    {
      src: path.resolve(__dirname, './fonts/Noto-Sans.ttf'),
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    {
      src: path.resolve(__dirname, './fonts/Noto-Sans-Bold.ttf'),
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  ],
});

const TicketsTemplate = props => {
  const { tickets, barcodes } = props;

  const Labeled = props => (
    <View style={{ flexDirection: 'row' }}>
      <Text style={{ color: '#737373' }}>{`${props.label}: `}</Text>
      <Text>{props.value}</Text>
    </View>
  );

  function formatDate(dateFrom, dateTo) {
    const format = 'ddd, D MMM LT';
    const dateFromMoment = moment(dateFrom);

    if (dateTo) {
      const dateToMoment = moment(dateTo);

      let formatted;

      formatted = dateFromMoment.format(format) + ' - ';

      if (dateFromMoment.diff(dateToMoment, 'days') > 1) {
        formatted += dateToMoment.format(format);
      } else {
        formatted += dateToMoment.format('LT');
      }

      return formatted;
    } else {
      return dateFromMoment.format(format);
    }
  }

  return (
    <Document>
      {tickets.map((ticket, index) => {
        const {
          ticketCode,
          name,
          eventName,
          dateFrom,
          dateTo,
          price,
          orderId,
          venue,
          currency,
          productName,
        } = ticket;

        const formatPrice = new Intl.NumberFormat(['nl-NL'], {
          style: 'currency',
          currency: currency,
          currencyDisplay: 'symbol',
        });
        const formattedPrice = formatPrice.format(price);

        const barcode = barcodes[index];

        return (
          <Page
            size="A4"
            style={{
              fontFamily: 'noto-sans',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flexGrow: 1,
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  fontSize: 10,
                  border: '1pt solid #000',
                  padding: 10,
                  width: '60vw',
                }}
              >
                <View style={{ fontSize: 12 }}>
                  <Text style={{ fontWeight: 'bold' }}>{eventName}</Text>
                  <Text>{formatDate(dateFrom, dateTo)}</Text>
                </View>

                <View style={{ marginVertical: '5' }}>
                  <Text>{`1x ${productName}`}</Text>
                  <Labeled label={'Price'} value={formattedPrice} />
                </View>

                <View style={{ marginVertical: '5' }}>
                  <Text style={{ fontWeight: 'bold' }}>{venue}</Text>
                </View>

                <View style={{ marginVertical: '5' }}>
                  <Labeled label={'Order ID'} value={orderId} />
                  <Labeled label={'Client name'} value={name} />
                </View>

                <View style={{ marginTop: '15', marginBottom: '5' }}>
                  <Image
                    source={{ data: barcode, format: 'png' }}
                    style={{ width: 173, height: 60 }}
                  />
                  <Text style={{ fontSize: 12 }}>{ticketCode}</Text>
                </View>
              </View>
            </View>
            <Image
              style={{ width: 105, height: 56, margin: 30 }}
              source={{
                data: fs.readFileSync(path.resolve(__dirname, './logo.png')),
                format: 'png',
              }}
            />
          </Page>
        );
      })}
    </Document>
  );
};

function generateBarcode(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text,
        scale: 3,
        height: 10,
      },
      function(err, png) {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      }
    );
  });
}

async function getAdditionalProps({ tickets }) {
  const barcodes = await Promise.all(
    tickets.map(({ ticketCode }) => generateBarcode(ticketCode))
  );

  return {
    barcodes,
  };
}

module.exports = new PdfTemplate(TicketsTemplate, getAdditionalProps);
