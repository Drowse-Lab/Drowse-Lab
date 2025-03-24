document.getElementById('blogForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const content = document.getElementById('blogContent').value;
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    if (currentHour >= 22 || currentHour < 6) { // 夜10時以降または朝6時前
        alert('ブログは朝に表示されます。');
        const displayTime = new Date(currentTime);
        displayTime.setHours(6, 0, 0, 0); // 翌朝6時に設定
        setTimeout(() => {
            displayBlogPost(content);
        }, displayTime - currentTime);
    } else {
        displayBlogPost(content);
    }
});

function displayBlogPost(content) {
    const blogPosts = document.getElementById('blogPosts');
    const post = document.createElement('div');
    post.textContent = content;
    blogPosts.appendChild(post);
}
