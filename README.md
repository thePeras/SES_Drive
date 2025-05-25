## Architecture

### frontend
- Provides a web interface for users to interact with their files and directories

### backend
Non sudo server:
- Manages authentication and authorization
- Provides a RESTful API for file and directory operations
- Non sudo server executions like creating, deleting, and renaming files and directories

### sudo backend
Sudo server:
- Manage unix users
- Manage ACL (Access Control Lists) for files and directories

## Development Setup

### Run docker container for the backend

If not build yet or changes to packages were made, run:
```bash
docker-compose build --no-cache
```

To start the backend watching for changes,
```bash
docker-compose up
```

## Notes

- Created users may not persisted when restarting the backend.


## Reqs

**Interface:**

- Each user shall have a local directory structure, much like the Unix file system. Users shall be able to:
    - Perform simple operations such as creating, deleting or renaming files via the graphical web frontend;
    - Perform batch or more advanced operations via a Unix-like shell environment over their local
    directory structure;
    - Both modes of operation may be supported by a backend RESTful API reminiscent of, e.g., (a
    simplification of) the Google Drive API.
- Users shall be able to share files/directories among each other.
- Users shall be able to publish a personal web page reminiscent of, e.g., (a simplification of) GitHub pages.
You are free to choose a design. For instance, a user may have a separate public HTML folder or all his/her
directory structure may be rendered via the backend's HTTP server.

**B. Authentication:**

- Users have to login in the web frontend before accessing their directory structure.
- Operations on a user's directory structure require authenticated users.
- You shall have a minimal authentication method, e.g., password-based. If you see fit you may additionally
use secure HTTPS communication for authenticated users. Note, however, that authentication and secure
communication are not the focus of this project.

 **C. Access control:**

- A user shall only have access to files/directories that he/she owns or that have been shared with him/her.
- A user may share a file/directory with other users with view or edit permissions.
◦ A user's personal web page is public.

## Deliverable dates
- Application Demo: May 30th
- Report submission: Jun 6th

## Proposed stack:

- Client web page: React with ShadCN
- Server:
- Databased:

Entities from the system:

- User
    - id int
    - name str
    - password str (sha256 + salt)
- File
    - name str
    - content str
    - type enum
    - write [int]
    - read [int]
    - owner int
    - is_public bool
- Directory
    - name str
    - files [file]
    - write [int]
    - read [int]
    - owner int
    - is_public bool
- Page
    - page_owner user