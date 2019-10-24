const React = require('react');
const { renderToStream } = require('@react-pdf/renderer');

class PdfTemplate {
  constructor(Component, getAdditionalProps = null) {
    this.getAdditionalProps = getAdditionalProps;
    this.Component = Component;
  }

  async render(props) {
    return renderToStream(await this._render(props));
  }

  async _render(props) {
    const Component = this.Component;
    const allProps = props;
    if (this.getAdditionalProps) {
      const asyncProps = await Promise.resolve(this.getAdditionalProps(props));
      Object.assign(allProps, asyncProps);
    }
    return <Component {...allProps} />;
  }
}

module.exports = PdfTemplate;
