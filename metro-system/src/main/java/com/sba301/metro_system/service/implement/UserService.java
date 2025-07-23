package com.sba301.metro_system.service.implement;

import com.sba301.metro_system.dto.request.ChangePasswordRequestDTO;
import com.sba301.metro_system.dto.request.LoginRequestDTO;
import com.sba301.metro_system.dto.request.SignupRequestDTO;
import com.sba301.metro_system.dto.request.UpdateAccountRequestDTO;
import com.sba301.metro_system.dto.request.user.UserDTO;
import com.sba301.metro_system.dto.response.BookingResponseDto;
import com.sba301.metro_system.dto.response.LoginResponse;
import com.sba301.metro_system.dto.response.TicketResponseDto;
import com.sba301.metro_system.dto.response.UserBookingResponseDto;
import com.sba301.metro_system.dto.response.UserResponseDto;
import com.sba301.metro_system.entity.Account;
import com.sba301.metro_system.entity.Booking;
import com.sba301.metro_system.entity.OTP;
import com.sba301.metro_system.entity.UserPrinciple;
import com.sba301.metro_system.enums.AccountStatus;
import com.sba301.metro_system.enums.Role;
import com.sba301.metro_system.exception.NotFoundException;
import com.sba301.metro_system.mapper.UserMapper;
import com.sba301.metro_system.record.MailBody;
import com.sba301.metro_system.repository.BookingRepository;
import com.sba301.metro_system.repository.OtpRepository;
import com.sba301.metro_system.repository.TicketRepository;
import com.sba301.metro_system.repository.UserRepository;
import com.sba301.metro_system.service.IEmailService;
import com.sba301.metro_system.service.IJwtService;
import com.sba301.metro_system.service.IOtpService;
import com.sba301.metro_system.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements IUserService {

    @Autowired
    private IJwtService jwtService;

    @Autowired
    AuthenticationManager authManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    IOtpService otpService;

    @Autowired
    IEmailService emailService;

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private BookingRepository bookingRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @Override
    public LoginResponse login(LoginRequestDTO loginRequestDTO) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDTO.getEmail(), loginRequestDTO.getPassword()));

        UserPrinciple userPrinciple = (UserPrinciple) authentication.getPrincipal();
        Account user = userPrinciple.getUser();
        if (user.getStatus() == AccountStatus.BANNED || user.getStatus() == AccountStatus.INACTIVE) {
            throw new RuntimeException("Your account is banned or inactive.");
        }
        String token = jwtService.generateToken(user.getEmail(), user.getAccountId());
        System.out.println(user.getRole());
        return new LoginResponse(user.getAccountId(), token, user.getFullname(), user.getRole().name(),
                user.getEmail());
    }

    @Override
    public String register(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Mail can not be null");
        }
        Account users = userRepository.findByEmail(email);
        if (users != null) {
            throw new IllegalArgumentException("Conflict mail");
        }
        Integer otp = otpService.generateOTP();
        otpService.save(email, otp);
        String text = "Welcome to Metro SG! Your OTP is: <strong>" + otp + "</strong>. It is valid for 5 minutes.";
        MailBody mailBody = MailBody.builder()
                .to(email)
                .subject("Your Metro SG OTP")
                .text(text)
                .build();
        emailService.sendOTP(mailBody);
        return "Send mail successfully";
    }

    @Override
    public UserResponseDto verify(SignupRequestDTO signupRequestDTO, Integer otp) {
        OTP otp1 = otpService.findByOtpToken(otp);
        if (otp1 == null) {
            throw new NotFoundException("Otp not found");
        }
        if (otp1.isExpired()) {
            otpRepository.delete(otp1);
            throw new RuntimeException("Otp has expired");
        }
        if (!otp1.getOtpToken().equals(otp)) {
            throw new IllegalArgumentException("Otp does not match expected value.");
        }
        if (!otp1.getMail().equals(signupRequestDTO.getEmail())) {
            throw new IllegalArgumentException("Otp does not match expected value.");
        }
        Account user = userRepository.findByEmail(signupRequestDTO.getEmail());
        if (user != null) {
            throw new IllegalArgumentException("Email already in use");
        }
        Account user2 = new Account();
        user2.setRole(Role.CUSTOMER);
        user2.setEmail(signupRequestDTO.getEmail());
        user2.setPassword(encoder.encode(signupRequestDTO.getPassword()));
        user2.setFullname(signupRequestDTO.getFullName());
        user2.setStatus(AccountStatus.ACTIVE);
        Account savedUser = userRepository.save(user2);
        otpRepository.delete(otpRepository.findByOtpToken(otp));
        return userMapper.toResponseDto(savedUser);
    }

    @Override
    public LoginResponse loginGoogle() {
        throw new RuntimeException("Google login not implemented yet");
    }

    @Override
    public List<UserResponseDto> getAllUser() {
        List<Account> users = userRepository.findAll();
        return userMapper.toResponseDtoList(users);
    }

    @Override
    public UserResponseDto updateUser(Long id, UserDTO user) {
        Optional<Account> accountOp = userRepository.findById(id);
        if (accountOp.isEmpty()) {
            throw new NotFoundException("User not found with id: " + id);
        }

        Account account = accountOp.get();
        account.setEmail(user.getEmail());
        account.setFullname(user.getFullname());
        account.setStatus(user.getStatus());

        Account updatedAccount = userRepository.save(account);

        return userMapper.toResponseDto(updatedAccount);
    }

    @Override
    public UserResponseDto getUserById(Long id) {
        Optional<Account> optionalAccount = userRepository.findById(id);
        if (optionalAccount.isEmpty()) {
            throw new NotFoundException("User not found with id: " + id);
        }

        Account account = optionalAccount.get();
        return userMapper.toResponseDto(account);
    }

    @Override
    public List<UserBookingResponseDto> getMyBooking(Long id) {
        List<Booking> bookings = bookingRepository.findBookingByAccount_AccountId(id);

        return bookings.stream()
                .map(this::mapToUserBookingResponseDto)
                .collect(Collectors.toList());
    }

    private UserBookingResponseDto mapToUserBookingResponseDto(Booking booking) {
        UserBookingResponseDto dto = new UserBookingResponseDto();

        dto.setBookingId(booking.getBookingId());

        // User name
        if (booking.getAccount() != null) {
            dto.setUserName(booking.getAccount().getFullname());
        }

        // Departure station info
        if (booking.getDepartureStation() != null) {
            UserBookingResponseDto.StationInfo departureStation = new UserBookingResponseDto.StationInfo();
            departureStation.setStationId(booking.getDepartureStation().getStationId());
            departureStation.setStationName(booking.getDepartureStation().getStationName());
            departureStation.setStationLocation(booking.getDepartureStation().getStationLocation());
            departureStation.setDescription(booking.getDepartureStation().getDescription());
            dto.setDepartureStation(departureStation);
        }

        // Arrival station info
        if (booking.getArrivalStation() != null) {
            UserBookingResponseDto.StationInfo arrivalStation = new UserBookingResponseDto.StationInfo();
            arrivalStation.setStationId(booking.getArrivalStation().getStationId());
            arrivalStation.setStationName(booking.getArrivalStation().getStationName());
            arrivalStation.setStationLocation(booking.getArrivalStation().getStationLocation());
            arrivalStation.setDescription(booking.getArrivalStation().getDescription());
            dto.setArrivalStation(arrivalStation);
        }

        // Route info
        if (booking.getRoute() != null) {
            UserBookingResponseDto.RouteInfo routeInfo = new UserBookingResponseDto.RouteInfo();
            routeInfo.setRouteId(booking.getRoute().getRouteId());
            routeInfo.setRouteName(booking.getRoute().getRouteName());
            routeInfo.setDescription(booking.getRoute().getRouteDescription());
            routeInfo.setDistance(booking.getRoute().getTotalDistance());
            dto.setRoute(routeInfo);
        }

        // Basic info
        dto.setOldPrice(booking.getOldPrice());
        dto.setNewPrice(booking.getNewPrice());
        dto.setPurchaseTime(booking.getPurchaseTime());

        // Ticket type name
        if (booking.getTicketType() != null) {
            dto.setTicketName(booking.getTicketType().getTicketName());
        }

        // Promotion
        if (booking.getPromotion() != null) {
            dto.setPromotionCode(booking.getPromotion().getPromotionCode());
        }

        dto.setUrlCheckout(booking.getQrUrl());
        dto.setPayOrderCode(booking.getBookingId());

        // Tickets info
        if (booking.getTickets() != null) {
            List<UserBookingResponseDto.TicketInfo> ticketInfos = booking.getTickets().stream()
                    .map(ticket -> {
                        UserBookingResponseDto.TicketInfo ticketInfo = new UserBookingResponseDto.TicketInfo();
                        ticketInfo.setTicketId(ticket.getTicketId());
                        ticketInfo.setTicketCode(ticket.getTicketId().toString()); // Use ticketId as code
                        ticketInfo.setValidFrom(ticket.getValidFrom());
                        ticketInfo.setValidTo(ticket.getValidTo());
                        ticketInfo.setStatus(
                                ticket.getTicketStatus() != null ? ticket.getTicketStatus().toString() : null);
                        return ticketInfo;
                    })
                    .collect(Collectors.toList());

            dto.setTickets(ticketInfos);
            dto.setNumberOfPassengers(booking.getTickets().size());
        } else {
            dto.setNumberOfPassengers(0);
        }

        return dto;
    }

    @Override
    public UserResponseDto updateMyAccount(Long userId, UpdateAccountRequestDTO updateAccountRequestDTO) {
        Account account = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        if (updateAccountRequestDTO.getEmail() != null &&
                !updateAccountRequestDTO.getEmail().equals(account.getEmail())) {
            Account existingUser = userRepository.findByEmail(updateAccountRequestDTO.getEmail());
            if (existingUser != null) {
                throw new IllegalArgumentException("Email already in use");
            }
            account.setEmail(updateAccountRequestDTO.getEmail());
        }

        if (updateAccountRequestDTO.getFullname() != null) {
            account.setFullname(updateAccountRequestDTO.getFullname());
        }

        Account updatedAccount = userRepository.save(account);
        return userMapper.toResponseDto(updatedAccount);
    }

    @Override
    public String changePassword(Long userId, ChangePasswordRequestDTO changePasswordRequestDTO) {
        Account account = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        if (!encoder.matches(changePasswordRequestDTO.getCurrentPassword(), account.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (!changePasswordRequestDTO.getNewPassword().equals(changePasswordRequestDTO.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        if (changePasswordRequestDTO.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long");
        }

        account.setPassword(encoder.encode(changePasswordRequestDTO.getNewPassword()));
        userRepository.save(account);

        return "Password changed successfully";
    }

    @Override
    public String forgotPassword(String email) {
        Account account = userRepository.findByEmail(email);
        if (account == null) {
            throw new NotFoundException("User not found with email: " + email);
        }

        // Generate OTP for password reset
        Integer otpValue = otpService.generateOTP();

        // Save OTP using service
        otpService.save(email, otpValue);

        // Send OTP via email
        MailBody mailBody = MailBody.builder()
                .to(email)
                .text("Your password reset OTP is: " + otpValue + ". This OTP will expire in 5 minutes.")
                .subject("Password Reset OTP")
                .build();
        emailService.sendOTP(mailBody);

        return "Password reset OTP has been sent to your email";
    }

    @Override
    public String resetPassword(String token, String newPassword) {
        try {
            Integer otpValue = Integer.parseInt(token);

            OTP otp = otpService.findByOtpToken(otpValue);
            if (otp == null) {
                throw new IllegalArgumentException("Invalid or expired OTP");
            }

            if (otp.isExpired()) {
                throw new IllegalArgumentException("OTP has expired");
            }

            Account account = userRepository.findByEmail(otp.getMail());
            if (account == null) {
                throw new NotFoundException("User not found for this OTP");
            }

            if (newPassword.length() < 6) {
                throw new IllegalArgumentException("New password must be at least 6 characters long");
            }

            account.setPassword(encoder.encode(newPassword));
            userRepository.save(account);

            otpRepository.delete(otp);

            return "Password reset successfully";
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid OTP format");
        }
    }

}