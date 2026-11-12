import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HomePageTest {
    private WebDriver driver;

    @BeforeEach
    void openBrowser() {
        driver = new ChromeDriver();
        driver.get(System.getProperty("baseUrl", "http://localhost:5173"));
    }

    @AfterEach
    void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void welcomePageLoadsWithoutAuth0Login() {
        assertTrue(driver.findElement(By.tagName("h1")).getText().contains("on campus"));
        assertTrue(driver.getPageSource().contains("Sign up with email"));
        assertTrue(driver.getPageSource().contains("Log in"));
    }

    @Test
    void loginFormValidatesEmailBeforeAuth0Redirect() {
        driver.findElement(By.xpath("//button[normalize-space()='Log in']")).click();
        driver.findElement(By.cssSelector("button.cta")).click();

        assertEquals("Enter a valid email address.",
                driver.findElement(By.id("login-help")).getText());
        assertTrue(driver.getCurrentUrl().contains("localhost:5173"));
    }

    @Test
    void signupFormValidatesSchoolAndEmailBeforeAuth0Redirect() {
        driver.findElement(By.xpath("//button[contains(normalize-space(), 'Sign up with email')]")).click();
        driver.findElement(By.cssSelector("button.cta")).click();

        assertEquals("Pick your school first.",
                driver.findElement(By.id("signup-help")).getText());
        assertTrue(driver.getCurrentUrl().contains("localhost:5173"));
    }
}
