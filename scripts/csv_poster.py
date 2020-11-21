import csv 
import json 
import requests 
import sys

node_url = "http://localhost:80/api/v1/"

# Function to convert a CSV to JSON 
# Takes the file paths as arguments 
def post_jsons(csvFilePath, index): 
      
    # create a dictionary 
    data = {} 
      
    # Open a csv reader called DictReader 
    with open(csvFilePath, encoding='utf-8') as csvf: 
        csvReader = csv.DictReader(csvf) 
          
        # Convert each row into a dictionary  
        # and add it to data 
        for rows in csvReader: 
              
            # Assuming a column named 'No' to 
            # be the primary key 
            key = rows['doc_id'] 
            data[key] = rows 

    # Send requests for each Document Individually
    node_meili_url = node_url + index + '/documents'    
    for keys in list(data.keys()):
        requests.post(node_meili_url, json={"documents": [data[keys]]})
        print('Posted: ' + keys)
    print(str(len(data)) + ' document(s) posted.')

# Run from command line
# Arg1: File location
# Arg2: IndexId
if __name__ == "__main__":
    post_jsons(sys.argv[1], sys.argv[2])
