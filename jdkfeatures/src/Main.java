import java.util.HashSet;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public record test(double a,double b){
        public double multiply() {
            return a * b;
        }

        public test{
            if(a==0){
                throw new IllegalArgumentException();
            }
        }//compact constructor used for validation, still no need of setters

    }
    public static void main(String[] args) {
        test t = new test(1,2);
        System.out.println(t.multiply());
        test t2  = new test(1,2);

        System.out.println(t.equals(t2));//objects are equal unlike classes

        HashSet<test> h1 = new HashSet<>();
        h1.add(t);
        h1.add(t2);

        System.out.println(h1.size());//hashset size remains 1 but would be 2 with classes

        test t3 = new test(0,1);
        }
    }
