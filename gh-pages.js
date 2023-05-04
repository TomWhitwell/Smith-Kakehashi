var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/TomWhitwell/test-host2.git', // Update to point to your repository  
        user: {
            name: 'tom whitwell', // update to use your name
            email: 'tom.whitwell@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)