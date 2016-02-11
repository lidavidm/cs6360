public class MyRobot extends reki.shim.Robot {
    public MyRobot() {

    }

    public void moveForward() {
        System.out.println("My move forward!");
    }

    public void run() {
        this.moveForward();
        this.turnLeft();
        this.turnRight();
    }

    public void turnRight() {
        System.out.println("Turn right by turning left 3x");
        this.turnLeft();
        this.turnLeft();
        this.turnLeft();
    }
}
