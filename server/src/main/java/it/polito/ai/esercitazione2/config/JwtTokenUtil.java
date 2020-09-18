package it.polito.ai.esercitazione2.config;

import java.io.Serializable;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
@Component
public class JwtTokenUtil implements Serializable {
    private static final long serialVersionUID = -2550185165626007488L;
    public static final long JWT_TOKEN_VALIDITY = 5 * 60 * 60; //5h
    @Value("${jwt.secret}")
    private String secret;

    /***************************************************************************************************************
     ******************************* METHOD TO RETRIEVE FIELDS FROM TOKEN*********************************************
     ***************************************************************************************************************
     ****************************************************************************************************************/

    //base method for Claim Retrieval
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    //retrieve username from jwt token
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }
    //retrieve authorities from jwt token
    public Collection getAuthorities(String token){
        return Arrays.stream(getClaimFromToken(token, x->x.get("AUTHORITIES")).toString().split(",")).map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
    //retrieve password
    public String getPassword(String token){
        return getClaimFromToken(token, x->x.get("PWD")).toString();
    }

    //retrieve expiration date from jwt token
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    //for retrieveing any information from token we will need the secret key
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
    }

    /***************************************************************************
     ************************* TOKEN VALIDATION ********************************
     ***************************************************************************/

    //check if the token has expired
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
    //validate token
    public Boolean validateToken(String token) {
        return (!isTokenExpired(token));
    }

    /***************************************************************************
     ************************* TOKEN GENERATION ********************************
     ***************************************************************************/


    //generate authentication token
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        String authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return doGenerateToken(claims, userDetails.getUsername(),authorities);
    }

    // generate registration token
    public String generateRegisterRequest(String id,String pwd,Collection<String> roles) {
        Map<String, Object> claims = new HashMap<>();
        String authorities = roles.stream()
                .collect(Collectors.joining(","));
        return doGenerateRegisterRequest(claims, id,pwd,authorities);
    }

    // removal token
    public String generateIdRequest(String id) {
        Map<String, Object> claims = new HashMap<>();
        return doGenerateIdRequest(claims, id);
    }

    //while creating the token -
//1. Define  claims of the token, like Issuer, Expiration, Subject, and the ID
//2. Sign the JWT using the HS512 algorithm and secret key.
//3. According to JWS Compact Serialization(https://tools.ietf.org/html/draft-ietf-jose-json-web-signature-41#section-3.1)
//   compaction of the JWT to a URL-safe string
    private String doGenerateToken(Map<String, Object> claims, String subject, String auth) {
        return Jwts.builder().setClaims(claims).setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .claim("AUTHORITIES",auth)
                .signWith(SignatureAlgorithm.HS512, secret).compact();
    }
    private String doGenerateRegisterRequest(Map<String, Object> claims, String subject,String password, String auth) {
        return Jwts.builder().setClaims(claims).setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .claim("PWD",password)
                .claim("AUTHORITIES",auth)
                .signWith(SignatureAlgorithm.HS512, secret).compact();
    }
    private String doGenerateIdRequest(Map<String, Object> claims, String subject) {
        return Jwts.builder().setClaims(claims).setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .signWith(SignatureAlgorithm.HS512, secret).compact();
    }

}