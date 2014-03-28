bz-splitter
 split patches to easily search for the patch you want.

To use it:
1/ Fill the login/password variables in bin/rebuild_data.pl

2/ Create the bzsplitter database: CREATE DATABASE bzspliter;
And create a user or use an existing one.

3/ Build the data:
    perl bin/rebuild_data.pl

4/ Fill the DB access in environments/development.yml

5/ Launch the app
  ./bin/app.pl

6/ Open your browser and go to http://0.0.0.0:3000

7/ Enjoy!

