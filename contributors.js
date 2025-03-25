document.addEventListener('DOMContentLoaded', async () => {
    const contributorsDiv = document.getElementById('contributors');

    try {
        const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contributors');
        const contributors = await response.json();

        if (contributors.length === 0) {
            contributorsDiv.textContent = 'No contributors found';
            return;
        }

        contributors.forEach(contributor => {
            const contributorElement = document.createElement('div');
            contributorElement.classList.add('contributor');

            const avatar = document.createElement('img');
            avatar.src = contributor.avatar_url;
            avatar.alt = `${contributor.login}'s avatar`;
            avatar.classList.add('avatar');

            const name = document.createElement('h2');
            name.textContent = contributor.login;

            const profileLink = document.createElement('a');
            profileLink.href = contributor.html_url;
            profileLink.textContent = 'GitHub Profile';

            contributorElement.appendChild(avatar);
            contributorElement.appendChild(name);
            contributorElement.appendChild(profileLink);

            contributorsDiv.appendChild(contributorElement);
        });
    } catch (error) {
        console.error('Error fetching contributors:', error);
        contributorsDiv.textContent = 'Error loading contributors';
    }
});