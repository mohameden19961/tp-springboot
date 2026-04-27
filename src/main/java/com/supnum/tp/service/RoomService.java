package com.supnum.tp.service;

import com.supnum.tp.model.Room;
import com.supnum.tp.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserService userService;

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room createRoom(Room room) {
        String role = userService.getCurrentUser().getRole();
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'Admin peut créer des salles.");
        }
        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {
        String role = userService.getCurrentUser().getRole();
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'Admin peut supprimer des salles.");
        }
        if (!roomRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Salle introuvable.");
        }
        roomRepository.deleteById(id);
    }
}
