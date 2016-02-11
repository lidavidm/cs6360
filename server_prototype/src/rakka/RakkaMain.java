package rakka;

import com.sun.jdi.Bootstrap;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.VirtualMachineManager;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.IllegalConnectorArgumentsException;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.connect.VMStartException;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventQueue;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.VMDisconnectEvent;

import java.io.*;
import java.util.Map;

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
            vm.resume();

            new StreamHandlerThread(vm.process().getInputStream(), System.out).run();
            new StreamHandlerThread(vm.process().getErrorStream(), System.err).run();
            EventQueue events = vm.eventQueue();

            EVENT_LOOP:
            while (true) {
                EventSet e = events.remove();
                for (Event event : e) {
                    if (event instanceof VMDisconnectEvent) {
                        break EVENT_LOOP;
                    }

                    System.out.println(event);
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
