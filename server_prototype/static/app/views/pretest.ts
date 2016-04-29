// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import * as TestView from "views/test";
import * as Logging from "logging";
import {MultipleChoiceQuestion, Question, Code} from "views/test";

const PRETEST_ID = -10;

export const PRETEST: Question[] = [
    new MultipleChoiceQuestion("Student is a subclass of Person. Person defines a method called 'sleep', but Student does not. What happens if you tell a Student object to sleep?", null, [
        "(an error occurs)",
        "The student does nothing",
        "The student sleeps like a Person",
    ]),

    new MultipleChoiceQuestion("The class Bird has two methods, 'fly' and 'chirp'. What code (if any) is needed here to prevent an error?", `# Add code here
tweety.chirp()
tweety.chirp()
tweety.fly()`, [
        "(no code needed)",
        "tweety.fly",
        "tweety = Bird",
        "tweety = Bird()",
    ]),

    new MultipleChoiceQuestion("The class Robot has three methods: 'moveForward' (move forward by one square), 'turnLeft' (rotate 90° left), and 'turnRight' (rotate 90° right). Looking at the map, what code should be added below to move the robot to the red B?", `robot = Robot()
# Add code here`, [
        "(no code needed)",
        new Code("turnRight()\nmoveForward()\nmoveForward()"),
        new Code("turnLeft()\nmoveForward()\nmoveForward()"),
        new Code("robot.moveLeft()\nrobot.moveLeft()"),
        new Code("robot.turnRight()\nrobot.moveForward()\nrobot.moveForward()"),
    ], "assets/pretest_map.png"),

    new MultipleChoiceQuestion("The class Dog has a method 'makeSound' that prints the string \"woof\". The class Wolf is a subclass of Dog, which has a method 'makeSound' that prints the string \"awooo!\" What is the result of the following code?", `fido = Wolf()
fido.makeSound()`, [
        "(nothing is printed)",
        "(an error occurs)",
        "awooo!",
        "woof",
        "awooo! woof",
    ]),

    new MultipleChoiceQuestion("The class Robot has three methods: 'moveForward', 'turnLeft', and 'turnRight'. The class MineRobot is a subclass of Robot and has one method, 'mine'. Given the following code, what code could be added that would cause an error?", `wall_e = MineRobot()
# Add code here `, [
        "(none of these cause an error)",
        "wall_e.mine()",
        "wall_e.turnLeft()",
        "wall_e.turnRight()",
        "wall_e.moveForward()",
    ]),
];

interface PretestController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<PretestController> = <any> {
    controller: function(): PretestController {
        // TODO: grab UUID and pass it to the main game
        return {};
    },

    view: function(controller: PretestController): _mithril.MithrilVirtualElement<PretestController> {
        return m.component(TestView.Component, {
            oncomplete: function(answers: string[]) {
                alert("Test complete!");
                Logging.saveAnswers(PRETEST_ID, answers);
                window.setTimeout(() => {
                    m.route("/game", {}, true);
                }, 1250);
                document.getElementById("test").classList.add("vanish");
            },

            questions: PRETEST,

            title: "RCAT: Robot Commander Aptitude Test",
        });
    }
}
