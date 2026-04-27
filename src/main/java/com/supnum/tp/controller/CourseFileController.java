package com.supnum.tp.controller;

import com.supnum.tp.model.Course;
import com.supnum.tp.model.CourseFile;
import com.supnum.tp.model.User;
import com.supnum.tp.repository.CourseFileRepository;
import com.supnum.tp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.supnum.tp.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.nio.file.Path;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/courses/{courseId}/files")
@Transactional
public class CourseFileController {

    @Autowired private CourseFileRepository fileRepository;
    @Autowired private com.supnum.tp.service.CourseService courseService;
    @Autowired private com.supnum.tp.repository.CourseRepository courseRepository;
    @Autowired private UserService userService;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    private Course getAccessibleCourse(Long courseId) {
        return courseService.getById(courseId);
    }

    private void verifyTeacher(Course course) {
        User currentUser = userService.getCurrentUser();
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le professeur peut gérer les fichiers");
        }
    }

    @GetMapping
    public List<CourseFile> getFiles(@PathVariable Long courseId) {
        Course course = getAccessibleCourse(courseId);
        return fileRepository.findByCourseOrderByIdDesc(course);
    }

    @PostMapping
    public CourseFile addFile(@PathVariable Long courseId, @RequestBody CourseFile fileReq) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyTeacher(course);
        
        CourseFile file = new CourseFile();
        file.setCourse(course);
        file.setTitle(fileReq.getTitle());
        file.setUrl(fileReq.getUrl());
        file.setLocal(false);
        
        CourseFile saved = fileRepository.save(file);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return saved;
    }

    @PostMapping("/upload")
    public CourseFile uploadFile(@PathVariable Long courseId, 
                                @RequestParam("title") String title,
                                @RequestParam("file") MultipartFile file) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyTeacher(course);
        
        String fileName = fileStorageService.storeFile(file);
        
        CourseFile courseFile = new CourseFile();
        courseFile.setCourse(course);
        courseFile.setTitle(title);
        courseFile.setUrl(fileName);
        courseFile.setLocal(true);
        
        CourseFile saved = fileRepository.save(courseFile);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
        return saved;
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long courseId, @PathVariable Long fileId) {
        getAccessibleCourse(courseId); // Verify access
        CourseFile courseFile = fileRepository.findById(fileId).orElseThrow();
        
        if (!courseFile.isLocal()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ceci n'est pas un fichier local");
        }

        try {
            Path filePath = fileStorageService.getFilePath(courseFile.getUrl());
            Resource resource = new UrlResource(filePath.toUri());
            
            if(resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable");
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors du téléchargement");
        }
    }

    @DeleteMapping("/{fileId}")
    public void deleteFile(@PathVariable Long courseId, @PathVariable Long fileId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        verifyTeacher(course);
        fileRepository.deleteById(fileId);
        messagingTemplate.convertAndSend("/topic/updates/" + courseId, "REFRESH_DATA");
    }
}
