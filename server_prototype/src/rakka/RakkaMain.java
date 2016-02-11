package rakka;

import com.sun.jdi.*;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.*;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.MethodEntryRequest;
import com.sun.jdi.request.StepRequest;

import java.io.*;
import java.util.Map;
import java.util.Objects;

/**
 * Created by lidavidm on 2/10/16.
 */
public class RakkaMain {
    static class StreamHandlerThread extends Thread {
        private final BufferedReader reader;
        private final PrintStream writer;

        public StreamHandlerThread(InputStream is, OutputStream os) {
            reader = new BufferedReader(new InputStreamReader(is));
            writer = new PrintStream(os);
        }

        @Override
        public void run() {
            try {
                String line = "";
                while ((line = reader.readLine()) != null) {
                    writer.println(line);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        // For reference: http://stackoverflow.com/questions/21654255
        VirtualMachineManager vmm = Bootstrap.virtualMachineManager();
        LaunchingConnector connector = vmm.defaultConnector();
        Map<String, Connector.Argument> arguments = connector.defaultArguments();
        arguments.get("main").setValue("reki.RekiShim");
        arguments.get("options").setValue("-cp /home/lidavidm/Code/cornell/cs6360/server_prototype/out/production/server_prototype");
        try {
            VirtualMachine vm = connector.launch(arguments);

            EventQueue events = vm.eventQueue();
            EventRequestManager manager = vm.eventRequestManager();

            ThreadReference mainThread = null;
            for (ThreadReference thread : vm.allThreads()) {
                if (thread.name().equals("main")) {
                    mainThread = thread;
                    break;
                }
            }
            if (mainThread == null) {
                System.out.println("Couldn't find main thread!");
                return;
            }

            StepRequest stepRequest = manager.createStepRequest(mainThread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
            stepRequest.addClassFilter("MyRobot");
            stepRequest.enable();

//            MethodEntryRequest request = manager.createMethodEntryRequest();
//            request.setSuspendPolicy(EventRequest.SUSPEND_NONE);
//            request.addClassFilter("MyRobot");
//            request.enable();

            new StreamHandlerThread(vm.process().getInputStream(), System.out).start();
            new StreamHandlerThread(vm.process().getErrorStream(), System.err).start();

            vm.resume();

            EVENT_LOOP:
            while (true) {
                EventSet e = events.remove();
                for (Event event : e) {
                    if (event instanceof VMDisconnectEvent) {
                        break EVENT_LOOP;
                    }
                    else if (event instanceof MethodEntryEvent) {
                        MethodEntryEvent evt = (MethodEntryEvent) event;
                        System.out.println("Entering method: " + evt.method().name());
                    }
                    else if (event instanceof StepEvent) {
                        StepEvent evt = (StepEvent) event;
                        Location location = evt.location();
                        if (location.method().name().equals("run")) {
                            System.out.println("Got to: " + location.method().name() + " line " + location.lineNumber());
                        }
                        vm.resume();
                    }
                }
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (IllegalConnectorArgumentsException e) {
            e.printStackTrace();
        } catch (VMStartException e) {
            e.printStackTrace();
        }
    }
}
