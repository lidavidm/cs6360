package reki.shim;

/**
 * Created by lidavidm on 2/10/16.
 */
@SuppressWarnings("unused")
public abstract class Robot implements ReloadableRobot {
    public Robot() {

    }

    public void moveForward() {
        System.out.println("Robot moved forward");
    }

    public void turnLeft() {
        System.out.println("Robot turned left");
    }
}
