module.exports = {
  description: {
    className: 'pdp_description',
    extract: function extract($) {
      // Remove the style tag
      $('style').remove();

      return {
        // Deconstruct, then reconstruct the html
        html: $.html() 
          .replace(/\n|\t|\s{2,}/g, '')
          .replace(/\>\s*\</g, '><')
          .match(/\<\w+|\w+\>|\>([^\<]+)\</g)
          .map((tag) => {
            if ( (/^\>.*\<$/g).test(tag) ) {
              return tag.replace(/\<|\>/g, '');
            }
            return /\</.test(tag) ? tag + '>' : '</' + tag;
          })
          .join(''),
        text: $.text(),
        model_number: $.text().match(/\d{5,}/)[0]
      };
    },
  },
  images: {
    className: 'pdp_thumbnail',
    extract: function extract($) {
      return $.root().find('a')
        .map((i, anchor) => {
          return $(anchor).attr('href').match(/http\:\/\/[^\']*/);
        }).get();
    },
  },
  info: {
    className: 'pdp_info',
    extract: function extract($) {
      return {
        brand: $.root().find("[class*='brand']").text(),
        name: $.root().find("[class*='item_name']").text(),
        price: $.root().find("[itemprop='price']").text(),
        currency: $.root().find("[itemprop='currency']").attr("content"),
        color: $.root().find("[class*='color']").find(".selected").find("img").attr("alt"),
        size_availability: this.getSizeAvailability()
      };
    },
    getSizeAvailability: function getSizeAvailability() {
      let output = {};
      $.root().find(".item_size li").each((i, el) => {
        let key = $(el).find('label').text().trim();
        output[key] = !($(el).find('input').attr("disabled"));
      }); 
      return output;
    }
  }
};
