const React = require('react');
const { Document, Page, Text, View } = require('@react-pdf/renderer');
const PdfTemplate = require('./PdfTemplate');

function TicketCodesTemplate(props) {
  const { codes } = props;

  const alfabetLetters = [];
  for (let l = 0; l < 26; l++) {
    const letter = String.fromCharCode(97 + l).toUpperCase();
    alfabetLetters.push(letter);
  }

  return (
    <Document>
      <Page
        style={{
          paddingVertical: 15,
          paddingHorizontal: 30,
          fontSize: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          {alfabetLetters.map(letter => (
            <View style={{ marginVertical: 7, marginHorizontal: 4 }}>
              <Text
                style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}
              >
                {letter}
              </Text>
              <View>
                {codes
                  .filter(code => code.charAt(0) === letter)
                  .sort()
                  .map(code => (
                    <View
                      style={{
                        paddingVertical: 7,
                        borderTop: '1pt solid #000',
                        flexDirection: 'row',
                      }}
                    >
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          border: '1pt solid #000',
                          marginRight: 7,
                        }}
                      />
                      <Text>{code}</Text>
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

module.exports = new PdfTemplate(TicketCodesTemplate);
