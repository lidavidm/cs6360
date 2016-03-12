#!/usr/bin/env python2

import bdb
import threading
import time

# Using threading to emulate a JS callback
def js_bridge(callback, args):
    def js_side(*args):
        time.sleep(2)
        result = None
        if args and args[0] == "moveForward":
            result = "executed move forward"

        callback(result)

    thread = threading.Thread(target=js_side, args=args)
    thread.start()

class JSRunner(bdb.Bdb):
    def __init__(self):
        bdb.Bdb.__init__(self)
        self.js_args = None
        self.result = None
        self.result_ready = False
        self.js_result_ready = threading.Condition()

    def user_line(self, frame):
        if self.js_args is None:
            return

        js_bridge(self.callback, self.js_args)
        self.js_result_ready.acquire()
        while not self.result_ready:
            self.js_result_ready.wait()
        self.js_result_ready.release()

    def callback(self, result):
        self.js_result_ready.acquire()
        self.result = result
        self.result_ready = True
        self.js_result_ready.notify()
        self.js_result_ready.release()

    def halt(self, method):
        self.js_args = [method]
        self.set_trace()
        self.js_args = None
        return self.result

class ProxyClass(object):
    def moveForward(self):
        result = runner.halt("moveForward")
        return result

runner = JSRunner()

namespace = {
    ProxyClass: ProxyClass,
    runner: runner,
}

runner.run("""
print "before"
robot = ProxyClass()
print robot.moveForward()
print "done"
""")
