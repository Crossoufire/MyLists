### MyLists

MyLists is a website with a nice and clear interface which allows you to track all your TV shows, Anime and Movies. 
It integrates statistics, so you can see how much time you spent. Moreover, you can follow people, see their lists  
and compare it to yours. You can see a live version here: [https://mylists.info](https://mylists.info).

![MyLists](https://raw.githubusercontent.com/Crossoufire/MyLists/master/MyLists/static/img/home2.jpg)

MyLists uses [Flask](http://flask.pocoo.org/) and [Material Design for Bootstrap 4](https://mdbootstrap.com/)

### Features

* Create a list for all of your series, anime and movies.
* Get informed of your next series, anime and movies to airs.
* Compare your list with your follows.
* Get statistics about your lists (Time spent, number of episodes watched, prefered genres, etc...)
* More to come!

### Prerequisites

* Python 3.6, 3.7, 3.8, 3.9+ (Developed and tested with these versions)
* pip3

### Installation

```
git clone https://www.github.com/Crossoufire/MyLists.git
cd MyLists
pip3 install -r requirements.txt
```

Before starting the program, you *MUST* create a `.env` file respecting the following syntax:

```
SQLALCHEMY_DATABASE_URI=sqlite:///your-db-name.db

MAIL_SERVER=your-mail-server
MAIL_PORT=port
MAIL_USE_SSL=True|False
MAIL_USE_TLS=True|False
MAIL_USERNAME=mail@mail.com
MAIL_PASSWORD=password

THEMOVIEDB_API_KEY=themoviedb-api-key
GOOGLE_BOOKS_API_KEY=google-books-api-key
CLIENT_IGDB=igdb-client-id
SECRET_IGDB=igdb-secret
IGDB_API_KEY=igdb-api-key	

SECRET_KEY=change-me
ENV=production
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
TESTING=False
FLASK_DEBUG=False
```

If you need more settings, feel free to adapt it as you want.

If you want to first test the project locally, you should modify in your `.env` file these values:
```
ENV=development
SESSION_COOKIE_SECURE=False
TESTING=True
FLASK_DEBUG=True
```

Then run the command `python3 Run.py` and open the link [http://localhost:5000](http://localhost:5000).

### Administration

When you run the program for the first time, it will create 3 users: one `user`, one `manager` and one `admin` with 
all the same password `password`:

* `user` - Standard user
* `manager` - Standard user with the right to manage media:
    * Can lock any media, so it won't be updated anymore by cron (to be used for old media with no update needed).
    * When a media is locked, you can edit some of its metadata.
* `admin` - Used for administration tasks (access to all `/admin` pages). Should not be used as a standard user account.
Does not appear in the "Hall of fame" and its statistics are not taken into account.

## Miscellaneous

We started this project to fulfill our needs. The live version [https://mylists.info](https://mylists.info) runs on a 
raspberry pi 4B, thus not meant to be used by a lot of people at the same time, but if you can see the register button 
at the top right of the homepage, feel free to do it. Otherwise, you can run your own version of MyLists ;).

## Contact

<contact@mylists.info>
