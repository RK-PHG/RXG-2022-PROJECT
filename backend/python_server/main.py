import requests
from flask import Flask,request,jsonify
from concurrent.futures import ThreadPoolExecutor
from flask_cors import *
import threading
import json
import time

app = Flask(__name__)
CORS(app, supports_credentials=True)
Lock = threading.Lock
userName = "RK_PHG"
token = "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"

def GetURL(arr,url): 
  try:  
    resp = requests.get(url=url,auth=(userName,token)).json()
    data = resp["company"]
  except:
    data = None
  finally:
    arr.append(data)
  time.sleep(1)

# 100 threads for url requests
def getUrls(urls):
    result = []
    Pool = ThreadPoolExecutor(50)
    for url in urls:
        Pool.submit(GetURL,result,url,) 
    while True:
      if len(result)==len(urls):
         break 
    return result

@app.route("/")
def getCompanys():
    urls = request.args.get("urls")
    urls = json.loads(urls)
    return json.dumps(getUrls(urls))

if __name__ == "__main__":
    app.run()