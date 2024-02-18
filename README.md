# MyLists

[MyLists](https://mylists.info) is your go-to platform for organizing your favorite series, anime, movies, games, and books. 
With a clean and user-friendly interface, it regroups the functionalities of multiple sites into one.
MyLists integrates features such as total viewing time, comments, favorites, and more.

Live version here: [https://mylists.info](https://mylists.info)

contact: <contact.us.at.mylists@gmail.com> 


# Key Features

* Build your lists for all your series, anime, movies, games and books. 
* Level up your Profile and lists with the leveling systems, and climb up the Hall of Fame!
* Get detailed statistics about your entertainment habits (time spent, number of episodes watched, preferred genres, rating distribution, etc...).
* Stay informed about upcoming episodes in your series/anime, along with new movies.
* Follow your friends and get updates on their lists.
* Compare your lists with other users.
* Notifications system.
* And more to come!


---
# Backend Installation (Python - Flask)

## Prerequisites

* Python 3.9+
* WSL2 recommended for Windows to use cron jobs

## Steps
1. Install python and create a virtual env
```
pip install virtual-env
python -m venv venv-mylists
```

2. Clone this repo and install the requirements
```
git clone https://www.github.com/Crossoufire/MyLists.git
cd MyLists/backend
pip install -r requirements.txt
```

3. Set up the `.flaskenv` file
```
FLASK_APP=server.py
FLASK_DEBUG=<0|1>
```

4. Create a `.env` file
```
SECRET_KEY=<change-me>

MAIL_SERVER=<your-mail-server>
MAIL_PORT=<port>
MAIL_USE_TLS=<True|False>
MAIL_USE_SSL=<True|False>
MAIL_USERNAME=<mail@mail.com>
MAIL_PASSWORD=<password>

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-secret>
GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-secret>

THEMOVIEDB_API_KEY=<themoviedb-api-key>
GOOGLE_BOOKS_API_KEY=<google-books-api-key>
CLIENT_IGDB=<igdb-client-id>
SECRET_IGDB=<igdb-secret>
IGDB_API_KEY=<igdb-api-key>
```

5. Run the command `python server.py` inside the `MyLists/backend` folder. 
The backend will be served by default at [http://localhost:5000](http://localhost:5000).

---


# Frontend Installation (Node - React)

## Prerequisites
- WSL2 recommended for Windows
- Node.js > 19
- npm > 9

## Steps
1. Clone this repo and install the requirements
```
git clone https://www.github.com/Crossoufire/MyLists.git
cd MyLists/frontend
npm install
```

2. Create the `.env.development` file for development (`.env.production` for production)
```
VITE_BASE_API_URL=http://localhost:5000
VITE_REGISTER_CALLBACK=http://localhost:3000/register_token
VITE_RESET_PASSWORD_CALLBACK=http://localhost:3000/reset_password
VITE_OAUTH2_CALLBACK=http://localhost:3000/oauth2/{provider}/callback
```
3. Run the command`npm run dev` inside the `MyLists/frontend` folder. The frontend will be served by default at http://localhost:3000.

