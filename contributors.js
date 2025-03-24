document.addEventListener('DOMContentLoaded', function() {
    const repoOwner = 'Drowse-Lab';
    const repoName = 'Drowse-Lab';
    const contributorsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`;

    fetch(contributorsUrl)
        .then(response => response.json())
        .then(contributors => {
            const contributorsContainer = document.getElementById('contributors');
            contributors.forEach(contributor => {
                fetch(contributor.url)
                    .then(response => response.json())
                    .then(profile => {
                        const profileHtml = `
                            <div class="contributor">
                                <img src="${profile.avatar_url}" alt="${profile.login}" class="avatar">
                                <h2>${profile.name || profile.login}</h2>
                                <p>${profile.bio || '紹介文はありません'}</p>
                                <a href="${profile.html_url}" target="_blank">GitHubプロフィール</a>
                            </div>
                        `;
                        contributorsContainer.innerHTML += profileHtml;
                    });
            });
        })
        .catch(error => console.error('Error fetching contributors:', error));
});
