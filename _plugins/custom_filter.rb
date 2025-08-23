module Jekyll
  module CustomFilter
    # カスタムフィルター: 任意の文字列を大文字に変換する
    def upcase(input)
      input.upcase
    end
  end
end

Liquid::Template.register_filter(Jekyll::CustomFilter)
