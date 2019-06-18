# Blackboard Gradecenter scraper
> Scrape files student test attempts from blackboard automatically. 

## Usage

### Step 1

Open up the Chrome devtools and goto `Sources > Snippets`. Create a new snippet and copy the contents of `get-attempt-files.js` in it.

![Step 1](./docs/1.png)

### Step 2

Open up the Needs Grading page.

![Step 2](./docs/2.png)

### Step 3

Run the snippet. Files will now be downloaded to your Downloads folder.

![Step 3](./docs/3.png)

### Renaming files

Files that were uploaded that do not have an extension cannot be properly renamed, so they are downloaded with their original filename as it exist on the server. Lines are printed on the console to rename these files. 

![Step mv](./docs/mv.png)

You can also save the entire console output to a file at once.

![Step mv save](./docs/mv-save-console.png)

Copy/paste this in a terminal-window in the Downloads directory.

![Step mv terminal](./docs/mv-terminal.png)

#### About

Made by Jeroen Overschie. Cheers 🌼