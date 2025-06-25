# Secure File Storage System

> **Project** <br />
> Course Unit: [Security in Software Engineering](https://sigarra.up.pt/feup/en/ucurr_geral.ficha_uc_view?pv_ocorrencia_id=537131 "Segurança em Engenharia de Software"), 1nd year
> <br />
> Course: [Master in Software Engineering](https://sigarra.up.pt/feup/en/cur_geral.cur_view?pv_curso_id=10861&pv_ano_lectivo=2024) <br />
> Faculty: **FEUP** (Faculty of Engineering of the University of Porto)
> <br/>
> Assignment: [PDF](docs/Assignment.pdf)
> <br/>
> Final Report: [PDF](docs/FinalReport.pdf)
> <br/>
> Project evaluation: **5**/6

## Project Goals

Web-based file management system that provides users with a personal, Unix-like directory structure. The primary goals are to offer a user experience through a dual-interface system, robust access control and simple authentication.

Key Project Goals:
- Dual-Interface File Management System: A graphical web frontend for basic file operations (create, delete, rename) and a Unix-like shell environment for advanced and batch operations. Both interfaces will be powered by a backend RESTful API.

- Enable Secure User Authentication and Access Control: Ensure users can only access their own files or files explicitly shared with them, with distinct "view" and "edit" permissions for shared content.

- Implement File Sharing and Public Web Page Hosting: Allow users to share files and directories with other registered users. Additionally, provide a feature for users to publish a personal, publicly accessible web page from their directory structure, similar to GitHub Pages.

## Approach

Using the server's own user system (Unix) instead of a traditional database. When a new person signs up, the system creates a dedicated Unix user for them to store their files securely in a personal folder.

This approach keeps permissions and data tightly linked, avoiding potential sync issues and security risks found in databases. For sharing files, the team used a Unix feature called Access Control Lists (ACLs) to grant specific "view" or "edit" access to other users.

Read the [Final Report](docs/FinalReport.pdf) for more details on the approach and decisions.

## Architecture

### frontend
- Provides a simple web interface for users to interact with their files and directories

### backend
Non sudo server:
- Manages authentication and authorization
- Provides a RESTful API for file and directory operations
- Non sudo server executions like creating, deleting, and renaming files and directories

### sudo backend
Sudo server:
- Manage unix users
- Manage ACL (Access Control Lists) for files and directories

## How to run

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
