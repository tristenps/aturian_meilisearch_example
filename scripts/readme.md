# Python Script for Meili

This script takes two arguments:

```bash
python3 csv_poster.py filename/location/to/csv.csv client_id
```

This script assumes docker-compose with it's existing settings are run with 
the nodejs service for posting documents running on port 8080.

This script will attempt to create a new client if the ARGS provided client_id does not match an existing value.
