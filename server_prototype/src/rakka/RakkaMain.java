package rakka;

import com.sun.jdi.Bootstrap;
import com.sun.jdi.ThreadReference;
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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Map;

/**
 * Created by lidavidm on 2/10/16.
 */
public class RakkaMain {
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

//            EventQueue events = vm.eventQueue();
//            EVENT_LOOP: while (true) {
//                EventSet e = events.remove();
//                for (Event event : e) {
//                    System.out.println(event);
//                    if (event instanceof VMDisconnectEvent) {
//                        break EVENT_LOOP;
//                    }
//                }
//            }
            BufferedReader reader = new BufferedReader(new InputStreamReader(vm.process().getInputStream()));
            reader.lines().forEach(System.out::println);
        } catch (IOException e) {
            e.printStackTrace();
        } catch (IllegalConnectorArgumentsException e) {
            e.printStackTrace();
        } catch (VMStartException e) {
            e.printStackTrace();
        }
    }
}
