package reki;

import reki.shim.ReloadableRobot;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;

/**
 * Created by lidavidm on 2/10/16.
 */
public class RekiShim {
    public static void main(String[] args) {
        System.out.println("This is Reki!");

        ClassLoader loader = null;
        try {
            loader = new URLClassLoader(new URL[] {
                    new URL("file:////tmp/"),
            }, RekiShim.class.getClassLoader());
            Class robotClass = loader.loadClass("MyRobot");
            ReloadableRobot robot = (ReloadableRobot) robotClass.newInstance();
            robot.moveForward();
            robot.turnLeft();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
    }
}
