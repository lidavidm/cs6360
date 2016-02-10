package reki;

import reki.shim.ReloadableRobot;

import javax.lang.model.SourceVersion;
import javax.tools.*;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Writer;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;

/**
 * Created by lidavidm on 2/10/16.
 */
public class RekiShim {
    static class StringFileObject extends SimpleJavaFileObject {
        private final String source;

        protected StringFileObject(String name, String source) {
            super(URI.create("string:///" + name + Kind.SOURCE.extension), Kind.SOURCE);
            this.source = source;
        }

        @Override
        public CharSequence getCharContent(boolean b) throws IOException {
            return this.source;
        }
    }

    public static void main(String[] args) {
        System.out.println("This is Reki!");

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        String[] options = new String[]{
                "-cp", "/tmp/server_prototype.jar",
                "-sourcepath", "/tmp",
                "-d", "/tmp",
        };

        try {
            StringFileObject code = new StringFileObject("MyRobot",
                    new String(Files.readAllBytes(Paths.get("/home/lidavidm/Code/cornell/cs6360/server_prototype/sample/MyRobot.java"))));
            JavaCompiler.CompilationTask task = compiler.getTask(null, null, null,
                    Arrays.asList(options),
                    null,
                    Collections.singletonList(code)
            );
            if (task.call()) {

            }
            else {
                System.err.println("Could not compile!");
                return;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }


        try {
            ClassLoader loader;
            loader = new URLClassLoader(new URL[]{
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
