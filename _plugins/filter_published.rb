module Jekyll
  class PublishedFilter < Jekyll::Generator
    def generate(site)
      # 公開済みの記事のみを表示する
      # true はその日のみ、nullは常にを追加したい
      site.posts.docs.select! { |post| post.data["published"] != false }
    end
  end
end

