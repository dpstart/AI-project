package it.polito.ai.esercitazione2.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Autowired
    private DataSource dataSource;

    @Bean
    public JdbcUserDetailsManager UserDetailsManager(){
        return new JdbcUserDetailsManager(dataSource);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

   @Autowired
    protected void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.jdbcAuthentication().dataSource(dataSource);
                /*usersByUsernameQuery(
                        "select username,password, enabled from users where username=?")
               .authoritiesByUsernameQuery(
                       "select username, authority from authorities where username=?")
                .passwordEncoder(passwordEncoder());
                .withUser(User.withUsername("admin") //to comment after the admin has been inserted
                        .password(passwordEncoder().encode("admin"))
                        .roles("ADMIN"));
                */

       JdbcUserDetailsManager manager=UserDetailsManager();
       List<GrantedAuthority> authority = new ArrayList<>();
       authority.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
       if (!manager.userExists("admin"))
            manager.createUser(new User("admin", passwordEncoder().encode("admin"), authority));



    }

    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.csrf().disable().authorizeRequests()
                .antMatchers(HttpMethod.POST,"/API/login").permitAll().and()
                .authorizeRequests()
                .antMatchers(HttpMethod.POST, "/API/students").permitAll().and()
                .authorizeRequests()
                .antMatchers(HttpMethod.POST, "/API/professors").permitAll().and()
                .authorizeRequests().antMatchers("/API/**").authenticated().and()
                .exceptionHandling().authenticationEntryPoint(jwtAuthenticationEntryPoint).and().sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        httpSecurity.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }



}
