package reki.shim;

/**
 * Base interface for reloadable game objects.
 * <p>
 * The problem: in Java, dynamically loaded classes cannot be statically referenced. Additionally, when they are
 * reloaded, they are technically a separate type, even when the class hasn't changed. To get around this, we refer to
 * objects only by a common superclass or interface: that is the purpose of this interface.
 * <p>
 * Created by lidavidm on 2/10/16.
 */
@SuppressWarnings("unused")
public interface ReloadableGameObject {
}
