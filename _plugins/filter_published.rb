module Jekyll
  class PublishedFilter < Jekyll::Generator
    def generate(site)
      # 公開済みの記事のみを表示する
      site.posts.docs.select! { |post| post.data["published"] != false }
    end
  end
end

