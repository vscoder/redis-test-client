#!/usr/bin/env python3
import random
import signal
import socket
import sys
import time
import threading
import traceback

from redis.sentinel import Sentinel

sentinel = Sentinel([('rfs-ldrs', 26379)], socket_timeout=1)
master = sentinel.master_for('mymaster', socket_timeout=1, retry_on_timeout=True)

key = socket.gethostname()
counter = 0
master.set(key, 0)

# Handle graceful termination by deleting the key
def sigterm_handler(_signo, _stack_frame):
  print('Exiting...')
  try:
    master.delete(key)
  except:
    print("Exception in DEL:", file=sys.stderr)
    print('-'*60, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print('-'*60, file=sys.stderr)
  sys.exit(0)
signal.signal(signal.SIGTERM, sigterm_handler)

def f():
  try:
    value = master.get(key)
    if value:
      print("key: %-20s  value: %-10d  counter: %-10d" % (key, int(value), counter))
  except:
    print("Exception in GET:", file=sys.stderr)
    print('-'*60, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print('-'*60, file=sys.stderr)
  threading.Timer(1, f).start()
f()

while True:
  try:
    master.incr(key)
    counter += 1
  except:
    print("Exception in INCR:", file=sys.stderr)
    print('-'*60, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print('-'*60, file=sys.stderr)
  delay_ms = random.randint(50, 250) / 1000.0
  time.sleep(delay_ms)
